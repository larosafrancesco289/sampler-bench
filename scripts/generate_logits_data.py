#!/usr/bin/env python3
"""
Generate Real Logits Data for Visualizer

This script connects to a running KoboldCpp server and extracts real token 
distributions to save as static data for the frontend visualizer.

Usage:
    python scripts/generate_logits_data.py --model llama-3.1-8b-instruct
"""

import json
import requests
import argparse
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional
import yaml

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent / "backend"))

def load_model_config() -> Dict[str, Any]:
    """Load model configuration."""
    config_path = Path(__file__).parent.parent / "backend" / "config" / "models.yaml"
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)

def get_model_port(model_name: str) -> int:
    """Get the port for a specific model."""
    config = load_model_config()
    models = config.get('models', {})
    
    if model_name in models:
        return models[model_name].get('port', 5002)
    
    # Default ports
    model_ports = {
        'mistral-small-24b': 5001,
        'llama-3.1-8b-instruct': 5002,
        'ministral-8b-instruct': 5003,
        'qwen3-8b': 5004,
        'mistral-nemo-12b': 5005,
        'gemma3-12b-it': 5006
    }
    
    return model_ports.get(model_name, 5002)

def check_server_status(port: int) -> bool:
    """Check if KoboldCpp server is running."""
    # Try different endpoints that KoboldCpp might use
    endpoints = [
        "/api/v1/info",
        "/api/extra/version", 
        "/api/latest/info",
        "/api/v1/model",
        "/",  # Root endpoint
    ]
    
    for endpoint in endpoints:
        try:
            print(f"   Trying endpoint: http://localhost:{port}{endpoint}")
            response = requests.get(f"http://localhost:{port}{endpoint}", timeout=5)
            print(f"   Response status: {response.status_code}")
            
            if response.status_code == 200:
                print(f"   Server responding at {endpoint}")
                if endpoint != "/":  # Don't print huge HTML for root
                    try:
                        print(f"   Server info: {response.json()}")
                    except:
                        print(f"   Server response (text): {response.text[:100]}...")
                return True
        except Exception as e:
            print(f"   Failed {endpoint}: {e}")
            continue
    
    print(f"   No working endpoints found")
    return False

def extract_token_logits_multi_sample(model_name: str, prompt: str, port: int) -> Optional[Dict[str, Any]]:
    """Extract token logits from KoboldCpp using multiple sampling runs to get more diverse tokens."""
    
    # Try different temperature values to get different token distributions
    temperatures = [0.1, 0.5, 1.0, 1.5, 2.0]
    all_tokens = {}  # token -> best logit seen
    endpoints = ["/api/v1/generate", "/api/extra/generate/check", "/api/latest/generate"]
    
    for temp in temperatures:
        for endpoint in endpoints:
            try:
                payload = {
                    "prompt": prompt,
                    "max_length": 1,
                    "max_context_length": 2048,
                    "temperature": temp,
                    "top_p": 1.0,
                    "top_k": 0,
                    "rep_pen": 1.0,
                    "rep_pen_range": 0,
                    "rep_pen_slope": 1.0,
                    "tfs": 1.0,
                    "typical": 1.0,
                    "sampler_order": [6, 0, 1, 3, 4, 2, 5],
                    "n": 1,
                    "stop_sequence": [],
                    "logprobs": True,
                    "use_memory": False,
                    "use_story": False,
                    "use_world_info": False,
                    "use_userscripts": False
                }
                
                response = requests.post(f"http://localhost:{port}{endpoint}", json=payload, timeout=30)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Extract tokens from this response
                    if 'results' in data and len(data['results']) > 0:
                        result = data['results'][0]
                        if 'logprobs' in result and result['logprobs']:
                            logprobs_data = result['logprobs']
                            
                            # Process the logprobs data
                            if isinstance(logprobs_data, dict) and 'content' in logprobs_data:
                                for item in logprobs_data['content']:
                                    if isinstance(item, dict) and 'token' in item and 'logprob' in item:
                                        token = str(item['token'])
                                        logit = float(item['logprob'])
                                        
                                        # Keep the highest logit for each token
                                        if token not in all_tokens or logit > all_tokens[token]:
                                            all_tokens[token] = logit
                                        
                                        # Also extract top alternatives
                                        if 'top_logprobs' in item and isinstance(item['top_logprobs'], list):
                                            for alt in item['top_logprobs']:
                                                if isinstance(alt, dict) and 'token' in alt and 'logprob' in alt:
                                                    alt_token = str(alt['token'])
                                                    alt_logit = float(alt['logprob'])
                                                    
                                                    if alt_token not in all_tokens or alt_logit > all_tokens[alt_token]:
                                                        all_tokens[alt_token] = alt_logit
                    
                    # If we got data from this endpoint, break to next temperature
                    if all_tokens:
                        break
                        
            except Exception as e:
                print(f"   Failed temperature {temp} endpoint {endpoint}: {e}")
                continue
    
    if all_tokens:
        # Convert to the expected format
        processed_tokens = []
        for i, (token, logit) in enumerate(sorted(all_tokens.items(), key=lambda x: x[1], reverse=True)):
            processed_tokens.append({
                "token": token,
                "logit": logit,
                "index": i
            })
        
        return {"logprobs": processed_tokens, "endpoint": "multi_sample"}
    
    return None

def extract_token_logits(model_name: str, prompt: str, port: int) -> Optional[Dict[str, Any]]:
    """Extract token logits from KoboldCpp using the new logprobs API (v1.77+)."""
    
    # First try the multi-sampling approach for more tokens
    multi_result = extract_token_logits_multi_sample(model_name, prompt, port)
    if multi_result:
        return multi_result
    
    # Fallback to single request approach
    endpoints = [
        "/api/v1/generate",
        "/api/extra/generate/check", 
        "/api/latest/generate"
    ]
    
    for endpoint in endpoints:
        try:
            # Request with logprobs enabled (KoboldCpp v1.77+)
            payload = {
                "prompt": prompt,
                "max_length": 1,  # Just get next token distribution
                "max_context_length": 2048,
                "temperature": 1.0,
                "top_p": 1.0,
                "top_k": 0,
                "rep_pen": 1.0,
                "rep_pen_range": 0,
                "rep_pen_slope": 1.0,
                "tfs": 1.0,
                "typical": 1.0,
                "sampler_order": [6, 0, 1, 3, 4, 2, 5],
                "n": 1,
                "stop_sequence": [],
                "logprobs": True,  # Request logprobs (KoboldCpp v1.77+)
                "use_memory": False,
                "use_story": False,
                "use_world_info": False,
                "use_userscripts": False
            }
            
            print(f"Trying endpoint: {endpoint} with logprobs")
            response = requests.post(
                f"http://localhost:{port}{endpoint}",
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"Success with endpoint: {endpoint}")
                print(f"Response keys: {data.keys()}")
                
                # Check for logprobs in various response formats
                if 'results' in data and len(data['results']) > 0:
                    result = data['results'][0]
                    print(f"Result keys: {result.keys()}")
                    
                    # Look for logprobs data
                    if 'logprobs' in result:
                        return {"logprobs": result['logprobs'], "endpoint": endpoint}
                    elif 'text' in result:
                        # At least we got text generation working
                        print(f"Generated text: {result['text']}")
                        return {"text": result['text'], "endpoint": endpoint, "logprobs": None}
                
                # Try to find logprobs at top level
                if 'logprobs' in data:
                    return {"logprobs": data['logprobs'], "endpoint": endpoint}
                
                return {"response": data, "endpoint": endpoint}
                
        except Exception as e:
            print(f"Error with endpoint {endpoint}: {e}")
            continue
    
    # Try the dedicated logprobs endpoint if available
    try:
        print("Trying dedicated logprobs endpoint: /api/extra/last_logprobs")
        response = requests.get(f"http://localhost:{port}/api/extra/last_logprobs", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"Logprobs endpoint response: {data.keys()}")
            return {"logprobs": data, "endpoint": "/api/extra/last_logprobs"}
    except Exception as e:
        print(f"Error with logprobs endpoint: {e}")
    
    return None

def generate_vocabulary_mapping(model_name: str, port: int) -> Dict[int, str]:
    """Generate a vocabulary mapping by testing individual tokens."""
    
    # Common tokens to test
    test_tokens = [
        "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", 
        "by", "from", "up", "about", "into", "through", "during", "before", "after",
        "I", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them",
        "is", "am", "are", "was", "were", "be", "been", "being", "have", "has", "had",
        "do", "does", "did", "will", "would", "could", "should", "may", "might", "can",
        "this", "that", "these", "those", "here", "there", "where", "when", "why", "how",
        "what", "which", "who", "whom", "whose", "all", "any", "some", "many", "much",
        "few", "little", "more", "most", "other", "another", "such", "no", "not", "only",
        "just", "very", "so", "too", "quite", "rather", "enough", "also", "even", "still"
    ]
    
    vocab_map = {}
    
    for i, token in enumerate(test_tokens):
        # Use token as a simple mapping - this is a fallback
        vocab_map[i] = token
    
    return vocab_map

def create_realistic_logits_dataset(model_name: str, num_scenarios: int = 5) -> Dict[str, Any]:
    """Create a comprehensive dataset of realistic logits for different scenarios."""
    
    port = get_model_port(model_name)
    
    if not check_server_status(port):
        print(f"KoboldCpp server not running on port {port}")
        print(f"Please start the server with: ./scripts/start_model_server.sh {model_name}")
        return None
    
    print(f"Connected to KoboldCpp server on port {port}")
    
    # Different prompt scenarios to get varied distributions
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
            "timestamp": None,
            "successful_extractions": 0,
            "total_attempts": len(scenarios)
        }
    }
    
    successful_extractions = 0
    
    for scenario in scenarios[:num_scenarios]:
        print(f"\nProcessing scenario: {scenario['name']}")
        print(f"   Prompt: '{scenario['prompt']}'")
        
        result = extract_token_logits(model_name, scenario['prompt'], port)
        
        if result and 'logprobs' in result and result['logprobs']:
            logprobs_data = result['logprobs']
            
            # Process logprobs data - format varies by KoboldCpp version
            processed_tokens = []
            
            # Handle KoboldCpp v1.94.2 logprobs format
            print(f"   Logprobs data type: {type(logprobs_data)}")
            print(f"   Logprobs sample: {str(logprobs_data)[:200]}...")
            
            if isinstance(logprobs_data, dict):
                # KoboldCpp v1.94.2 format: {"content": [...], "tokens": [...], "top_logprobs": {...}}
                if 'content' in logprobs_data and isinstance(logprobs_data['content'], list):
                    # Extract from content array - this contains the actual generated token
                    for item in logprobs_data['content']:
                        if isinstance(item, dict) and 'token' in item and 'logprob' in item:
                            processed_tokens.append({
                                "token": str(item['token']),
                                "logit": float(item['logprob']),
                                "index": len(processed_tokens)
                            })
                            
                            # Also extract top alternatives if available
                            if 'top_logprobs' in item and isinstance(item['top_logprobs'], list):
                                for alt in item['top_logprobs']:  # Take all alternatives
                                    if isinstance(alt, dict) and 'token' in alt and 'logprob' in alt:
                                        processed_tokens.append({
                                            "token": str(alt['token']),
                                            "logit": float(alt['logprob']),
                                            "index": len(processed_tokens)
                                        })
                
                # Fallback: try direct token->logprob mapping
                elif not processed_tokens:
                    for token, logprob in logprobs_data.items():
                        try:
                            # Handle case where logprob might be a list or dict
                            if isinstance(logprob, list):
                                logprob_value = logprob[0] if len(logprob) > 0 else 0
                            elif isinstance(logprob, dict):
                                logprob_value = logprob.get('logprob', 0)
                            else:
                                logprob_value = logprob
                                
                            processed_tokens.append({
                                "token": str(token),
                                "logit": float(logprob_value),
                                "index": len(processed_tokens)
                            })
                        except (ValueError, TypeError) as e:
                            print(f"   Skipping token {token}: {e}")
                            continue
                        
            elif isinstance(logprobs_data, list):
                # Format: [{"token": "word", "logprob": -0.1}, ...] or list of lists
                for i, item in enumerate(logprobs_data[:100]):
                    try:
                        if isinstance(item, dict):
                            # Dict format: {"token": "word", "logprob": value}
                            token = str(item.get('token', f'token_{i}'))
                            logprob = item.get('logprob', item.get('logit', 0))
                            
                            # Handle nested lists in logprob values
                            if isinstance(logprob, list):
                                logprob = logprob[0] if len(logprob) > 0 else 0
                                
                            processed_tokens.append({
                                "token": token,
                                "logit": float(logprob),
                                "index": i
                            })
                            
                        elif isinstance(item, (list, tuple)) and len(item) >= 2:
                            # List/tuple format: ["token", logprob] or ("token", logprob)
                            token = str(item[0])
                            logprob = item[1]
                            
                            if isinstance(logprob, list):
                                logprob = logprob[0] if len(logprob) > 0 else 0
                                
                            processed_tokens.append({
                                "token": token,
                                "logit": float(logprob),
                                "index": i
                            })
                    except (ValueError, TypeError, IndexError) as e:
                        print(f"   Skipping item {i}: {e}")
                        continue
            
            # Sort by logit value (highest first)
            processed_tokens.sort(key=lambda x: x['logit'], reverse=True)
            
            dataset["scenarios"][scenario['name']] = {
                "prompt": scenario['prompt'],
                "description": scenario['description'],
                "tokens": processed_tokens,
                "raw_logits_count": len(processed_tokens),
                "endpoint_used": result.get('endpoint', 'unknown'),
                "data_type": "real_logprobs_only"
            }
            
            successful_extractions += 1
            print(f"   Successfully extracted {len(processed_tokens)} tokens from logprobs")
            
        elif result and 'text' in result:
            print(f"   Got text generation but no logprobs - creating enhanced fallback")
            # Create context-aware fallback based on the generated text
            generated_text = result['text']
            fallback_tokens = generate_context_aware_fallback(scenario['prompt'], generated_text)
            
            dataset["scenarios"][scenario['name']] = {
                "prompt": scenario['prompt'],
                "description": scenario['description'],
                "tokens": fallback_tokens,
                "raw_logits_count": 0,
                "endpoint_used": result.get('endpoint', 'fallback'),
                "note": f"Enhanced fallback based on generated text: '{generated_text}'",
                "data_type": "enhanced_fallback"
            }
            
        else:
            print(f"   Failed to extract logits")
            # Create fallback data for this scenario
            dataset["scenarios"][scenario['name']] = {
                "prompt": scenario['prompt'],
                "description": scenario['description'],
                "tokens": generate_fallback_tokens(scenario['prompt']),
                "raw_logits_count": 0,
                "endpoint_used": "fallback",
                "note": "Generated fallback data - server didn't return logits"
            }
    
    dataset["generation_info"]["successful_extractions"] = successful_extractions
    dataset["generation_info"]["timestamp"] = str(Path(__file__).stat().st_mtime)
    
    return dataset

def generate_context_aware_fallback(prompt: str, generated_text: str = "") -> List[Dict[str, Any]]:
    """Generate context-aware fallback tokens based on prompt and generated text."""
    
    # Base tokens
    base_tokens = [
        "the", "a", "and", "to", "of", "in", "that", "is", "for", "on",
        "with", "as", "be", "by", "at", "this", "have", "from", "they",
        "we", "you", "all", "can", "had", "her", "was", "one", "our", "out"
    ]
    
    # Context-specific tokens based on prompt and generated text
    context_tokens = []
    combined_text = (prompt + " " + generated_text).lower()
    
    if any(word in combined_text for word in ["weather", "sunny", "cloudy", "rain"]):
        context_tokens = ["sunny", "cloudy", "rainy", "cold", "warm", "beautiful", "nice", "terrible"]
    elif any(word in combined_text for word in ["story", "once", "upon", "princess", "dragon"]):
        context_tokens = ["princess", "prince", "dragon", "castle", "forest", "magical", "brave", "young"]
    elif any(word in combined_text for word in ["hello", "how", "are", "you"]):
        context_tokens = ["you", "doing", "today", "fine", "good", "well", "great", "okay"]
    elif any(word in combined_text for word in ["algorithm", "computer", "technical"]):
        context_tokens = ["processing", "computing", "analyzing", "calculating", "optimizing", "sorting", "iterating"]
    else:
        # Use the first word of generated text as context if available
        if generated_text:
            first_word = generated_text.strip().split()[0] if generated_text.strip() else ""
            if first_word:
                context_tokens = [first_word]
    
    tokens = context_tokens + base_tokens
    
    # Generate realistic logit distribution
    result = []
    top_logit = 8.5
    
    for i, token in enumerate(tokens[:50]):
        # Exponential decay with deterministic noise
        decay_factor = 0.25
        noise = (hash(token + prompt) % 100 - 50) / 100 * 0.4
        logit = top_logit * (1 - i * decay_factor / 10) + noise
        
        # Ensure reasonable range
        logit = max(-5.0, min(logit, 12.0))
        
        result.append({
            "token": token,
            "logit": round(logit, 3),
            "index": i
        })
    
    return sorted(result, key=lambda x: x['logit'], reverse=True)

def generate_fallback_tokens(prompt: str) -> List[Dict[str, Any]]:
    """Generate realistic fallback tokens when server extraction fails."""
    
    # Context-aware token selection
    base_tokens = [
        "the", "a", "and", "to", "of", "in", "that", "is", "for", "on",
        "with", "as", "be", "by", "at", "this", "have", "from", "they",
        "we", "you", "all", "can", "had", "her", "was", "one", "our", "out"
    ]
    
    # Add context-specific tokens based on prompt
    if "weather" in prompt.lower():
        context_tokens = ["sunny", "cloudy", "rainy", "cold", "warm", "beautiful", "nice", "terrible"]
        tokens = context_tokens + base_tokens
    elif "story" in prompt.lower() or "once" in prompt.lower():
        context_tokens = ["princess", "prince", "dragon", "castle", "forest", "magical", "brave", "young"]
        tokens = context_tokens + base_tokens
    elif "algorithm" in prompt.lower():
        context_tokens = ["processing", "computing", "analyzing", "calculating", "optimizing", "sorting", "iterating"]
        tokens = context_tokens + base_tokens
    else:
        tokens = base_tokens
    
    # Generate realistic logit distribution
    result = []
    top_logit = 8.5
    
    for i, token in enumerate(tokens[:50]):
        # Exponential decay with noise
        decay_factor = 0.25
        noise = (hash(token) % 100 - 50) / 100 * 0.4  # Deterministic noise based on token
        logit = top_logit * (1 - i * decay_factor / 10) + noise
        
        # Ensure reasonable range
        logit = max(-5.0, min(logit, 12.0))
        
        result.append({
            "token": token,
            "logit": round(logit, 3),
            "index": i
        })
    
    return sorted(result, key=lambda x: x['logit'], reverse=True)

def main():
    parser = argparse.ArgumentParser(description="Generate real logits data from KoboldCpp")
    parser.add_argument("--model", default="llama-3.1-8b-instruct", 
                       help="Model name to use")
    parser.add_argument("--output", default="frontend/public/logits-data.json",
                       help="Output file path")
    parser.add_argument("--scenarios", type=int, default=3,
                       help="Number of scenarios to generate")
    
    args = parser.parse_args()
    
    print(f"Generating logits data for model: {args.model}")
    
    dataset = create_realistic_logits_dataset(args.model, args.scenarios)
    
    if not dataset:
        print("Failed to generate dataset")
        sys.exit(1)
    
    # Save to file
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump(dataset, f, indent=2)
    
    print(f"\nDataset saved to: {output_path}")
    print(f"   Successful extractions: {dataset['generation_info']['successful_extractions']}")
    print(f"   Total scenarios: {len(dataset['scenarios'])}")
    
    # Print summary
    for name, scenario in dataset['scenarios'].items():
        token_count = len(scenario['tokens'])
        method = "Real" if scenario.get('raw_logits_count', 0) > 0 else "Fallback"
        print(f"   {name}: {token_count} tokens ({method})")

if __name__ == "__main__":
    main()