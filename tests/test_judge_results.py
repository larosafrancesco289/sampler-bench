import json
from pathlib import Path

from scripts.judge_results import judge_benchmark_results


def test_judging_disables_penalties(tmp_path, monkeypatch):
    # Create minimal benchmark file
    data = {
        "benchmark_name": "t",
        "timestamp": "",
        "model_name": "m",
        "model_config": {},
        "prompts": ["p"],
        "sampler_configs": {"s": {"description": "", "sampler": "min_p", "parameters": {}}},
        "samples": [
            {
                "sample_id": 1,
                "prompt": "p",
                "sampler_name": "s",
                "sampler_config": {},
                "generated_text": "text",
                "word_count": 10,
                "timestamp": "",
                "repetition": 1,
            }
        ],
        "metadata": {"max_length": 10, "total_samplers": 1, "total_prompts": 1, "repetitions": 1, "total_samples": 1},
    }
    input_file = tmp_path / "res.json"
    input_file.write_text(json.dumps(data))

    class DummyJudge:
        # Treat as multi-judge
        judge_models = ["x"]
        consensus_method = "average"

        def get_criteria_info(self):
            return {"narrative_structure": {}, "creativity_execution": {}}

        def evaluate_text(self, **kwargs):
            class R:
                overall_score = 5.0
                overall_std = 0.0
                summary = ""
                evaluation_time = 0.1
                judge_models = ["x"]
                judge_count = 1
                consensus_method = "average"
                individual_results = [{
                    'judge_model': 'x',
                    'overall_score': 5.0,
                    'criterion_scores': {
                        'narrative_structure': {'score': 5.0, 'reasoning': ''}
                    },
                    'summary': ''
                }]

                class CS:
                    criterion = "narrative_structure"
                    mean_score = 5.0
                    std_score = 0.0
                    consensus_strength = 1.0
                    judge_models = ["x"]
                    individual_scores = [5.0]

                criterion_scores = [CS()]

            return R()

    # Patch factory to return our dummy judge
    from scripts import judge_results as jr

    def create_judge():
        return DummyJudge()

    monkeypatch.setattr(jr, "create_judge", create_judge)

    out_file = judge_benchmark_results(str(input_file), output_dir=str(tmp_path))
    assert out_file is not None
    result = json.loads(Path(out_file).read_text())
    # Ensure penalty field is absent (penalties disabled)
    assert all((s['judgment'] is None) or ('instruction_penalties' not in s['judgment']) for s in result['samples'])


