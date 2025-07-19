#!/usr/bin/env python3
"""
Generate Full Vocabulary Logits Data from llama.cpp Server

This script connects to a running llama.cpp server and extracts clean token
distributions (20 tokens per scenario) for sampling visualization.

Compared to KoboldCpp, this provides:
- More tokens (20 vs 5-6)
- Clean, authentic probability distributions
- Better visualization of sampling effects

Usage:
    # First start llama.cpp server:
    bash scripts/start_llama_server.sh
    
    # Then generate data:
    python scripts/generate_logits_llamacpp.py --port 5007
"""

import json
import requests
import argparse
import sys
import time
from pathlib import Path
from typing import Dict, List, Any, Optional

def check_server_status(port: int) -> bool:
    """Check if llama.cpp server is running."""
    try:
        response = requests.get(f"http://localhost:{port}/health", timeout=5)
        if response.status_code == 200:
            print(f"   ✅ llama.cpp server responding on port {port}")
            return True
    except Exception as e:
        print(f"   ❌ llama.cpp server not responding on port {port}: {e}")
        return False
    
    return False

def get_server_info(port: int) -> Optional[Dict[str, Any]]:
    """Get server information."""
    try:
        response = requests.get(f"http://localhost:{port}/props", timeout=5)
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"   Error getting server info: {e}")
    return None

def extract_full_logits(prompt: str, port: int) -> Optional[List[Dict[str, Any]]]:
    """Extract full vocabulary logits from llama.cpp server."""
    
    try:
        # Request completion with full logits
        payload = {
            "prompt": prompt,
            "n_predict": 1,  # Just predict one token
            "temperature": 1.0,
            "top_p": 1.0,
            "top_k": -1,  # Consider all tokens
            "repeat_penalty": 1.0,
            "stop": [],
            "stream": False,
            "logit_bias": {},
            "logprobs": True,  # Request log probabilities
            "n_probs": 20,  # Request top 20 probabilities for visualization
            "cache_prompt": False
        }
        
        print(f"   Requesting full logits from llama.cpp...")
        response = requests.post(
            f"http://localhost:{port}/completion",
            json=payload,
            timeout=60  # Longer timeout for full logits
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Response keys: {list(data.keys())}")
            
            # Check for completion_probabilities
            if 'completion_probabilities' in data:
                probs_data = data['completion_probabilities']
                print(f"   Found completion_probabilities with {len(probs_data)} items")
                
                if len(probs_data) > 0:
                    first_token_probs = probs_data[0]  # First (and only) predicted token
                    if 'top_logprobs' in first_token_probs:
                        top_logprobs = first_token_probs['top_logprobs']
                        print(f"   Found {len(top_logprobs)} token probabilities")
                        
                        # Convert to our format
                        tokens = []
                        import math
                        for i, prob_info in enumerate(top_logprobs):
                            if 'token' in prob_info and 'logprob' in prob_info:
                                logit = prob_info['logprob']
                                # Convert logit to probability: prob = exp(logit)
                                prob = math.exp(logit)
                                
                                tokens.append({
                                    "token": prob_info['token'],
                                    "logit": logit,
                                    "probability": prob,
                                    "index": i
                                })
                        
                        # Already sorted by logit (highest first) from the API
                        return tokens
            
            # Fallback: check for other logprobs formats
            elif 'timings' in data and 'content' in data:
                print(f"   Generated text: '{data['content']}'")
                print(f"   No full vocabulary probabilities found in response")
                return None
            
            else:
                print(f"   Unexpected response format: {list(data.keys())}")
                return None
                
        else:
            print(f"   Error: HTTP {response.status_code}")
            print(f"   Response: {response.text[:200]}...")
            return None
            
    except Exception as e:
        print(f"   Error extracting logits: {e}")
        return None

def create_full_logits_dataset(port: int = 5007, num_scenarios: int = 5) -> Dict[str, Any]:
    """Create a comprehensive dataset with full vocabulary logits."""
    
    if not check_server_status(port):
        print(f"❌ llama.cpp server not running on port {port}")
        print(f"Please start the server with: ./scripts/start_llama_server.sh")
        return None
    
    # Get server info
    server_info = get_server_info(port)
    model_name = "llama.cpp"
    if server_info and 'default_generation_settings' in server_info:
        print(f"✅ Connected to llama.cpp server")
        print(f"   Server info: {server_info.get('default_generation_settings', {})}")
    
    # Different prompt scenarios
    scenarios = [
        {
            "name": "article_start",
            "prompt": "The weather today is",
            "description": "Beginning of a factual sentence"
        },
        {
            "name": "story_opening", 
            "prompt": "Once upon a time, there was a",
            "description": "Creative story beginning"
        },
        {
            "name": "conversation",
            "prompt": "Hello, how are",
            "description": "Casual conversation"
        },
        {
            "name": "technical",
            "prompt": "The algorithm works by",
            "description": "Technical explanation"
        },
        {
            "name": "question",
            "prompt": "What is the most important",
            "description": "Question formation"
        }
    ]
    
    dataset = {
        "model": model_name,
        "port": port,
        "scenarios": {},
        "vocab_size": 0,
        "generation_info": {
            "timestamp": str(time.time()),
            "successful_extractions": 0,
            "total_attempts": len(scenarios[:num_scenarios]),
            "server_info": server_info
        }
    }
    
    successful_extractions = 0
    
    for scenario in scenarios[:num_scenarios]:
        print(f"\n🔄 Processing scenario: {scenario['name']}")
        print(f"   Prompt: '{scenario['prompt']}'")
        
        tokens = extract_full_logits(scenario['prompt'], port)
        
        if tokens and len(tokens) > 0:
            dataset["scenarios"][scenario['name']] = {
                "prompt": scenario['prompt'],
                "description": scenario['description'],
                "tokens": tokens,  # All 20 tokens for visualization
                "total_vocab_size": len(tokens),
                "data_type": "full_vocabulary_logits"
            }
            
            successful_extractions += 1
            print(f"   ✅ Successfully extracted {len(tokens)} tokens for visualization")
            
            # Update vocab size if this is larger
            if len(tokens) > dataset["vocab_size"]:
                dataset["vocab_size"] = len(tokens)
                
        else:
            print(f"   ❌ Failed to extract logits for scenario: {scenario['name']}")
            # Don't add failed scenarios to the dataset
    
    dataset["generation_info"]["successful_extractions"] = successful_extractions
    
    return dataset

def main():
    parser = argparse.ArgumentParser(description="Generate full vocabulary logits from llama.cpp")
    parser.add_argument("--port", type=int, default=5007,
                       help="llama.cpp server port")
    parser.add_argument("--output", default="frontend/public/logits-data.json",
                       help="Output file path")
    parser.add_argument("--scenarios", type=int, default=5,
                       help="Number of scenarios to generate")
    
    args = parser.parse_args()
    
    print(f"🚀 Generating full vocabulary logits from llama.cpp server on port {args.port}")
    
    dataset = create_full_logits_dataset(args.port, args.scenarios)
    
    if not dataset:
        print("❌ Failed to generate dataset")
        sys.exit(1)
    
    # Save to file
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump(dataset, f, indent=2)
    
    print(f"\n✅ Dataset saved to: {output_path}")
    print(f"   Successful extractions: {dataset['generation_info']['successful_extractions']}")
    print(f"   Total vocabulary size: {dataset['vocab_size']}")
    print(f"   Total scenarios: {len(dataset['scenarios'])}")
    
    # Print summary
    for name, scenario in dataset['scenarios'].items():
        token_count = len(scenario['tokens'])
        vocab_size = scenario.get('total_vocab_size', token_count)
        print(f"   {name}: {token_count} tokens from llama.cpp")

if __name__ == "__main__":
    main()