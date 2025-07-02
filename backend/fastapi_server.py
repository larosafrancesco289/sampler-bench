"""
FastAPI server that wraps the SamplerBenchAPI for frontend integration.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
import os
import sys
from pathlib import Path
import json
from datetime import datetime

# Add the project root to the Python path to enable imports
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from backend.api.quality_api import SamplerBenchAPI

# Pydantic models for request/response validation
class InitializeJudgeRequest(BaseModel):
    api_key: Optional[str] = None
    model: Optional[str] = None

class InitializeGeneratorRequest(BaseModel):
    model_name: str

class GenerateSampleRequest(BaseModel):
    prompt: str
    sampler_name: str
    max_length: int = 512
    seed: Optional[int] = None
    max_retries: int = 3

class EvaluateQualityRequest(BaseModel):
    text: str
    prompt: str
    sampler_config: Dict[str, Any]

class RunBenchmarkRequest(BaseModel):
    prompts: List[str]
    sampler_names: Optional[List[str]] = None
    max_length: int = 512

class LoadResultsRequest(BaseModel):
    filepath: str

# FastAPI app initialization
app = FastAPI(
    title="Sampler Benchmark API",
    description="API for running and evaluating text generation sampler benchmarks",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global API instance
api_instance = None

def get_api_instance():
    """Get or create the API instance."""
    global api_instance
    if api_instance is None:
        api_instance = SamplerBenchAPI()
    return api_instance

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Sampler Benchmark API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running"
    }

@app.post("/api/judge/initialize")
async def initialize_judge(request: InitializeJudgeRequest):
    """Initialize the LLM judge."""
    api = get_api_instance()
    result = api.initialize_judge(api_key=request.api_key, model=request.model)
    if not result['success']:
        raise HTTPException(status_code=400, detail=result['error'])
    return result

@app.post("/api/generator/initialize")
async def initialize_generator(request: InitializeGeneratorRequest):
    """Initialize the text generator."""
    api = get_api_instance()
    result = api.initialize_generator(request.model_name)
    if not result['success']:
        raise HTTPException(status_code=400, detail=result['error'])
    return result

@app.get("/api/models")
async def get_available_models():
    """Get list of available models."""
    api = get_api_instance()
    return api.get_available_models()

@app.get("/api/samplers")
async def get_available_samplers():
    """Get list of available samplers."""
    api = get_api_instance()
    return api.get_available_samplers()

@app.post("/api/generate")
async def generate_single_sample(request: GenerateSampleRequest):
    """Generate a single text sample."""
    api = get_api_instance()
    result = api.generate_single_sample(
        prompt=request.prompt,
        sampler_name=request.sampler_name,
        max_length=request.max_length,
        seed=request.seed,
        max_retries=request.max_retries
    )
    if not result['success']:
        raise HTTPException(status_code=400, detail=result['error'])
    return result

@app.post("/api/evaluate")
async def evaluate_quality(request: EvaluateQualityRequest):
    """Evaluate the quality of generated text."""
    api = get_api_instance()
    result = api.evaluate_quality(
        text=request.text,
        prompt=request.prompt,
        sampler_config=request.sampler_config
    )
    if not result['success']:
        raise HTTPException(status_code=400, detail=result['error'])
    return result

@app.post("/api/benchmark/run")
async def run_quality_benchmark(request: RunBenchmarkRequest):
    """Run a complete quality benchmark."""
    api = get_api_instance()
    result = api.run_quality_benchmark(
        prompts=request.prompts,
        sampler_names=request.sampler_names,
        max_length=request.max_length
    )
    if not result['success']:
        raise HTTPException(status_code=400, detail=result['error'])
    return result

@app.post("/api/results/load")
async def load_existing_results(request: LoadResultsRequest):
    """Load existing benchmark results from file."""
    api = get_api_instance()
    result = api.load_existing_results(request.filepath)
    if not result['success']:
        raise HTTPException(status_code=400, detail=result['error'])
    return result

@app.get("/api/results")
async def get_results():
    """Get benchmark results in the format expected by the frontend."""
    # Look for the most recent results file
    results_dir = Path("results")
    if not results_dir.exists():
        raise HTTPException(status_code=404, detail="No results directory found")
    
    # Find the most recent .json file in results directory
    json_files = list(results_dir.glob("*.json"))
    if not json_files:
        raise HTTPException(status_code=404, detail="No benchmark results found")
    
    # Get the most recent file
    latest_file = max(json_files, key=lambda f: f.stat().st_mtime)
    
    try:
        with open(latest_file, 'r') as f:
            data = json.load(f)
        
        # Transform the data to match the frontend's expected format
        leaderboard = []
        
        # Extract samples from the loaded data
        samples = data.get('samples', [])
        if not samples:
            # Try to extract from results structure if it exists
            samples = data.get('results', {}).get('samples', [])
        
        # Group by sampler and calculate average scores
        sampler_stats = {}
        for sample in samples:
            sampler_name = sample.get('sampler_name', 'Unknown')
            score = sample.get('judgment', {}).get('overall_score', 0)
            
            if sampler_name not in sampler_stats:
                sampler_stats[sampler_name] = {
                    'scores': [],
                    'total_samples': 0,
                    'config': sample.get('sampler_config', {})
                }
            
            sampler_stats[sampler_name]['scores'].append(score)
            sampler_stats[sampler_name]['total_samples'] += 1
        
        # Create leaderboard entries
        for sampler_name, stats in sampler_stats.items():
            avg_score = sum(stats['scores']) / len(stats['scores']) if stats['scores'] else 0
            leaderboard.append({
                'rank': 0,  # Will be set after sorting
                'sampler_name': sampler_name,
                'avg_quality_score': round(avg_score, 2),
                'samples_count': stats['total_samples'],
                'config_preview': str(stats['config'])[:100] + "..." if len(str(stats['config'])) > 100 else str(stats['config']),
                'strengths': ["High quality output"],  # Placeholder
                'badges': ["Tested"] if stats['total_samples'] > 0 else []
            })
        
        # Sort by average score and assign ranks
        leaderboard.sort(key=lambda x: x['avg_quality_score'], reverse=True)
        for i, entry in enumerate(leaderboard):
            entry['rank'] = i + 1
        
        # Create summary
        summary = {
            'total_samples': len(samples),
            'unique_samplers': len(sampler_stats),
            'avg_quality_score': round(sum(s['avg_quality_score'] for s in leaderboard) / len(leaderboard), 2) if leaderboard else 0,
            'models_tested': 1,  # Placeholder
            'last_updated': datetime.fromtimestamp(latest_file.stat().st_mtime).isoformat()
        }
        
        return {
            'leaderboard': leaderboard,
            'summary': summary,
            'raw_data': [data]  # Include the original data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading results file: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True) 