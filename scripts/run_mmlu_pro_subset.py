#!/usr/bin/env python3
"""
MMLU-Pro Subset Runner (Objective Accuracy)

Loads a small, reproducible subset of MMLU-Pro and evaluates sampler effects
by prompting the local model (KoboldCpp) to output a single letter choice.

Outputs a judged-style JSON into results/ so the existing frontend can render
accuracy as the "average_score" per sampler.
"""

import argparse
import json
import random
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import yaml

# Ensure backend is importable
sys.path.append(str(Path(__file__).parent.parent / "backend"))
from api.quality_api import SamplerBenchAPI  # type: ignore


LETTER_CHOICES = [
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
    "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T",
]


def safe_import_datasets():
    try:
        from datasets import load_dataset  # type: ignore
        return load_dataset
    except Exception as exc:
        raise RuntimeError(
            "The 'datasets' package is required. Please install it (e.g., pip install datasets)."
        ) from exc


def normalize_example(example: Dict[str, Any]) -> Tuple[str, List[str], int, Optional[str]]:
    """Extract question, options, correct index, and category in a robust way.

    Supports common key variants across dataset mirrors.
    """
    def get_first(keys: List[str]) -> Optional[Any]:
        for k in keys:
            if k in example and example[k] is not None:
                return example[k]
        return None

    question = get_first(["question", "question_text", "query", "prompt"])
    if not isinstance(question, str):
        raise ValueError("Unsupported example: missing question text")

    options = get_first(["options", "choices", "answers", "answer_choices"])
    if isinstance(options, list):
        options_list = [str(o) for o in options]
    elif isinstance(options, str):
        # Some mirrors store pipe-separated choices
        options_list = [o.strip() for o in options.split("|") if o.strip()]
    else:
        raise ValueError("Unsupported example: missing options/choices list")

    # Normalize answer → index
    answer_raw = get_first(["answer", "correct", "label", "target", "answer_idx", "gold"])
    if answer_raw is None:
        raise ValueError("Unsupported example: missing answer field")

    correct_index: Optional[int] = None
    if isinstance(answer_raw, int):
        correct_index = answer_raw
    elif isinstance(answer_raw, str):
        upper = answer_raw.strip().upper()
        if upper in LETTER_CHOICES:
            correct_index = LETTER_CHOICES.index(upper)
        else:
            # Try to match a letter at start like "B)" or "(C)"
            match = re.match(r"[^A-Z]*([A-Z])", upper)
            if match and match.group(1) in LETTER_CHOICES:
                correct_index = LETTER_CHOICES.index(match.group(1))
    if correct_index is None:
        raise ValueError(f"Unsupported answer format: {answer_raw}")

    category = get_first(["category", "subject", "domain"])  # optional
    if isinstance(category, (int, float)):
        category = str(category)
    if not isinstance(category, str):
        category = None

    return question, options_list, int(correct_index), category


def build_prompt(question: str, options: List[str]) -> str:
    # Clamp number of options to available letters
    max_opts = min(len(options), len(LETTER_CHOICES))
    lines = [
        "You are solving a multiple-choice problem.",
        "Return ONLY the option letter (A-J) with no punctuation or words.",
        "If unsure, choose the most plausible answer.",
        "",
        f"Question: {question}",
        "",
        "Options:",
    ]
    for i in range(max_opts):
        lines.append(f"{LETTER_CHOICES[i]}. {options[i]}")
    lines.extend(["", "Answer:"])
    return "\n".join(lines)


def extract_choice(text: str) -> Optional[str]:
    """Extract first A–T letter guess from model output."""
    if not text:
        return None
    # Common patterns: "C", "Answer: C", "(C)", "C.", "C)"
    match = re.search(r"\b([A-T])\b", text.strip().upper())
    if match:
        return match.group(1)
    # Fallback: first capital letter in range
    for ch in text.strip().upper():
        if ch in LETTER_CHOICES:
            return ch
    return None


def derive_seed(global_seed: int, model_name: str, sampler_name: str, qid: str) -> int:
    import hashlib
    payload = f"{global_seed}|{model_name}|{sampler_name}|{qid}".encode("utf-8")
    digest = hashlib.sha256(payload).hexdigest()
    return int(digest[:8], 16)


def main():
    parser = argparse.ArgumentParser(description="Run MMLU-Pro subset with objective accuracy")
    parser.add_argument("--config", "-f", default=None, help="Optional YAML config file (e.g., backend/config/mmlu_pro_subset.yaml)")
    # CLI overrides config if provided
    parser.add_argument("--model", "-m", default=None, help="Model name from backend/config/models.yaml (overrides config)")
    parser.add_argument("--samplers", "-s", nargs="+", default=None, help="Sampler names to test (overrides config)")
    parser.add_argument("--subset-size", "-n", type=int, default=None, help="Number of questions to evaluate (overrides config)")
    parser.add_argument("--categories", "-c", nargs="*", help="Optional list of categories/subjects to filter (overrides config)")
    parser.add_argument("--seed", "-d", type=int, default=None, help="Global seed for reproducible subsampling and decoding (overrides config)")
    parser.add_argument("--split", default=None, help="Dataset split to use (overrides config)")
    parser.add_argument("--dataset", default=None, help="Hugging Face dataset name (overrides config)")
    parser.add_argument("--output-dir", "-o", default=None, help="Directory to save results (overrides config)")
    parser.add_argument("--max-new-tokens", type=int, default=None, help="Max tokens to generate for the answer (overrides config)")

    args = parser.parse_args()

    # Load config (optional)
    cfg_model = cfg_samplers = cfg_subset = cfg_seed = None
    cfg_dataset_name = cfg_split = cfg_categories = cfg_max_new_tokens = cfg_output_dir = None
    if args.config:
        cfg_path = Path(args.config)
        if not cfg_path.exists():
            raise FileNotFoundError(f"Config file not found: {cfg_path}")
        with open(cfg_path, "r") as f:
            full_cfg = yaml.safe_load(f) or {}
        bc = (full_cfg or {}).get("benchmark_config", full_cfg or {})

        def g(path: List[str], default=None):
            node = bc
            for key in path:
                if not isinstance(node, dict) or key not in node:
                    return default
                node = node[key]
            return node

        # Read values with flexible keys to allow simple or nested configs
        cfg_model = g(["generation", "model"]) or bc.get("model")
        cfg_samplers = g(["experimental_design", "samplers"]) or bc.get("samplers")
        cfg_subset = g(["experimental_design", "subset_size"]) or bc.get("subset_size")
        cfg_seed = g(["reproducibility", "seed"]) or bc.get("seed")
        cfg_dataset_name = g(["dataset", "name"]) or bc.get("dataset_name")
        cfg_split = g(["dataset", "split"]) or bc.get("split")
        cfg_categories = g(["dataset", "categories"]) or bc.get("categories")
        cfg_max_new_tokens = g(["generation", "max_new_tokens"]) or bc.get("max_new_tokens")
        cfg_output_dir = g(["output_config", "results_dir"]) or bc.get("output_dir")

    # Effective settings: CLI > config > defaults (mirrors robust workflow)
    model_name = args.model or cfg_model or "llama-3.1-8b-instruct"
    default_samplers = ["model_default", "standard_minp", "creative_minp", "standard_sigma", "creative_sigma"]
    samplers = args.samplers or (list(cfg_samplers) if cfg_samplers else default_samplers)
    subset_size = args.subset_size or (int(cfg_subset) if cfg_subset else 20)
    seed = args.seed if args.seed is not None else (int(cfg_seed) if cfg_seed is not None else 42)
    dataset_name = args.dataset or cfg_dataset_name or "TIGER-Lab/MMLU-Pro"
    split = args.split or cfg_split or "test"
    categories = args.categories or (list(cfg_categories) if cfg_categories else [])
    max_new_tokens = args.max_new_tokens or (int(cfg_max_new_tokens) if cfg_max_new_tokens else 8)
    output_dir = args.output_dir or cfg_output_dir or "results"

    # Load dataset
    load_dataset = safe_import_datasets()
    ds = load_dataset(dataset_name)
    if split not in ds:
        raise RuntimeError(f"Split '{split}' not found in dataset. Available: {list(ds.keys())}")
    data = ds[split]

    # Materialize to python list of examples to allow deterministic sampling
    all_examples: List[Dict[str, Any]] = []
    for i in range(len(data)):
        ex = data[i]
        # Attach a stable id if present
        ex_id = ex.get("id") or ex.get("qid") or f"{split}-{i}"
        ex["__id"] = str(ex_id)
        try:
            # Filterable normalization check
            _ = normalize_example(ex)
            all_examples.append(ex)
        except Exception:
            # Skip malformed examples silently for subset runs
            continue

    # Optional category filtering
    if categories:
        cats = {c.lower() for c in categories}
        filtered: List[Dict[str, Any]] = []
        for ex in all_examples:
            _, _, _, cat = normalize_example(ex)
            if cat and cat.lower() in cats:
                filtered.append(ex)
        all_examples = filtered

    if len(all_examples) == 0:
        raise RuntimeError("No examples available after filtering.")

    # Deterministic subset
    rng = random.Random(seed)
    subset = all_examples if len(all_examples) <= subset_size else rng.sample(all_examples, subset_size)

    # Initialize generator API
    api = SamplerBenchAPI()
    gen_init = api.initialize_generator(model_name)
    if not gen_init.get("success"):
        raise RuntimeError(f"Failed to initialize generator: {gen_init.get('error')}")

    model_config = gen_init["config"]

    # Prepare results skeleton compatible with frontend
    results: Dict[str, Any] = {
        "benchmark_name": f"MMLU-Pro Subset ({len(subset)}) - {model_name}",
        "timestamp": datetime.now().isoformat(),
        "model_name": model_name,
        "model_config": model_config,
        "prompts": [],  # not used by frontend for accuracy runs
        "sampler_configs": {},
        "samples": [],
        "metadata": {
            "task": "mmlu_pro",
            "dataset": dataset_name,
            "split": split,
            "subset_size": len(subset),
            "categories": categories or [],
            "max_new_tokens": max_new_tokens,
        },
    }

    # Attach sampler configs
    for sampler_name in samplers:
        if sampler_name in api.samplers:
            results["sampler_configs"][sampler_name] = api.samplers[sampler_name]

    # Iterate samplers × questions
    total = len(samplers) * len(subset)
    completed = 0
    sampler_correct_counts: Dict[str, int] = {s: 0 for s in samplers}
    sampler_total_counts: Dict[str, int] = {s: 0 for s in samplers}

    for sampler_name in samplers:
        for ex in subset:
            q, opts, gold_idx, cat = normalize_example(ex)
            prompt = build_prompt(q, opts)
            qid = ex["__id"]

            # Deterministic per-sample seed
            sample_seed = derive_seed(seed, model_name, sampler_name, qid)

            gen = api.generate_single_sample(prompt, sampler_name, max_length=max_new_tokens, seed=sample_seed)
            if not gen.get("success"):
                # Record a failed sample with incorrect=0
                sample = {
                    "sample_id": len(results["samples"]) + 1,
                    "question_id": qid,
                    "prompt": prompt,
                    "sampler_name": sampler_name,
                    "sampler_config": api.samplers.get(sampler_name, {}).get("parameters", {}),
                    "generated_text": None,
                    "prediction_letter": None,
                    "gold_letter": LETTER_CHOICES[gold_idx] if gold_idx < len(LETTER_CHOICES) else None,
                    "is_correct": False,
                    "word_count": 0,
                    "category": cat,
                    "timestamp": datetime.now().isoformat(),
                    # Judged-style payload for frontend
                    "judgment": {
                        "overall_score": 0.0,
                        "criterion_scores": [{"criterion": "accuracy", "score": 0.0}],
                        "summary": f"generation_failed: {gen.get('error')}",
                        "evaluation_time": 0.0,
                    },
                }
                results["samples"].append(sample)
                sampler_total_counts[sampler_name] += 1
                completed += 1
                continue

            text = gen.get("generated_text", "")
            pred_letter = extract_choice(text)
            gold_letter = LETTER_CHOICES[gold_idx] if gold_idx < len(LETTER_CHOICES) else None
            correct = (pred_letter == gold_letter)

            sample = {
                "sample_id": len(results["samples"]) + 1,
                "question_id": qid,
                "prompt": prompt,
                "sampler_name": sampler_name,
                "sampler_config": gen.get("sampler_config", {}),
                "generated_text": text,
                "prediction_letter": pred_letter,
                "gold_letter": gold_letter,
                "is_correct": bool(correct),
                "word_count": len(text.split()) if isinstance(text, str) else 0,
                "category": cat,
                "timestamp": datetime.now().isoformat(),
                # Judged-style payload for frontend: 1.0 for correct, 0.0 for wrong
                "judgment": {
                    "overall_score": 1.0 if correct else 0.0,
                    "criterion_scores": [{"criterion": "accuracy", "score": 1.0 if correct else 0.0}],
                    "summary": "correct" if correct else "incorrect",
                    "evaluation_time": 0.0,
                },
            }
            results["samples"].append(sample)
            sampler_total_counts[sampler_name] += 1
            if correct:
                sampler_correct_counts[sampler_name] += 1

            completed += 1

    # Save file (use _judged_ to allow frontend to pick it up)
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    clean_model_name = model_name.replace("-", "").replace(".", "").replace("_", "")
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    filename = f"{clean_model_name}_mmlupro_subset{len(subset)}_judged_{timestamp}.json"
    out_path = Path(output_dir) / filename

    with open(out_path, "w") as f:
        json.dump(results, f, indent=2)

    # Print quick summary per sampler
    print(f"Saved results to: {out_path}")
    for s in samplers:
        tot = sampler_total_counts.get(s, 0)
        cor = sampler_correct_counts.get(s, 0)
        acc = (cor / tot * 100.0) if tot > 0 else 0.0
        print(f"{s}: {cor}/{tot} correct ({acc:.1f}%)")


if __name__ == "__main__":
    main()


