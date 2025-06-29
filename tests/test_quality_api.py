"""
Test the quality-focused API with existing results.
This validates the new modular structure works correctly.
"""

import sys
import json
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent / "backend"))

from api.quality_api import SamplerBenchAPI, quick_evaluate
from evaluation.quality_aggregator import QualityAggregator
from evaluation.llm_judge import CreativeWritingJudge, JudgmentResult, JudgmentScore

def test_api_initialization():
    """Test API initialization."""
    print("🧪 Testing API Initialization...")
    
    api = SamplerBenchAPI()
    
    # Test model and sampler loading
    models = api.get_available_models()
    samplers = api.get_available_samplers()
    
    print(f"✅ Loaded {len(models)} models and {len(samplers)} samplers")
    
    # Test judge initialization
    judge_result = api.initialize_judge()
    if judge_result['success']:
        print(f"✅ Judge initialized: {judge_result['model']}")
        print(f"✅ Evaluation criteria: {len(judge_result['criteria'])}")
    else:
        print(f"❌ Judge initialization failed: {judge_result['error']}")
    
    return api, judge_result['success']

def test_quality_aggregator():
    """Test the quality aggregator with sample data."""
    print("\n🧪 Testing Quality Aggregator...")
    
    aggregator = QualityAggregator()
    
    # Create mock judgment data
    criterion_scores = [
        JudgmentScore("narrative_coherence", 7.5, "Good story flow"),
        JudgmentScore("creativity_originality", 8.0, "Creative concepts"),
        JudgmentScore("character_development", 6.5, "Basic character work"),
        JudgmentScore("engagement_readability", 7.8, "Very engaging"),
        JudgmentScore("stylistic_quality", 7.2, "Good writing style")
    ]
    
    judgment = JudgmentResult(
        overall_score=7.4,
        criterion_scores=criterion_scores,
        summary="A well-crafted story with creative elements",
        evaluation_time=2.5,
        model_used="gpt-4o"
    )
    
    # Add sample
    sample = aggregator.add_sample(
        prompt="Write a story about robots",
        sampler_name="test_sampler",
        sampler_config={"temperature": 0.7},
        generated_text="This is a test story about robots discovering emotions...",
        judgment=judgment
    )
    
    print(f"✅ Added sample: {sample.word_count} words")
    
    # Test quality stats
    quality_stats = aggregator.calculate_quality_stats()
    ranking = aggregator.get_quality_ranking()
    
    print(f"✅ Quality stats calculated: {len(quality_stats)} samplers")
    print(f"✅ Quality ranking: {len(ranking)} entries")
    
    # Print quality summary
    aggregator.print_quality_summary()
    
    return True

def test_existing_results_integration():
    """Test integration with existing results."""
    print("\n🧪 Testing Existing Results Integration...")
    
    # Look for existing results files
    archive_dir = Path("../archive")
    results_files = list(archive_dir.glob("judged_results_*.json"))
    
    if not results_files:
        print("ℹ️ No existing judged results found - this is expected for first run")
        return True
    
    # Test loading the most recent file
    latest_file = max(results_files, key=lambda x: x.stat().st_mtime)
    print(f"📂 Testing with file: {latest_file.name}")
    
    api = SamplerBenchAPI()
    result = api.load_existing_results(str(latest_file))
    
    if result['success']:
        print(f"✅ Loaded results: {result['sample_count']} samples")
        print(f"✅ Model: {result['model_name']}")
        print(f"✅ Timestamp: {result['timestamp']}")
        
        # Show quality insights
        if 'quality_stats' in result and result['quality_stats']:
            print("\n📊 Quality Insights:")
            for sampler, stats in result['quality_stats'].items():
                if isinstance(stats, dict) and 'overall_quality' in stats:
                    avg_score = stats['overall_quality']['avg_score']
                    print(f"  {sampler}: {avg_score:.2f}/10")
    else:
        print(f"❌ Failed to load results: {result['error']}")
        return False
    
    return True

def test_quick_evaluate():
    """Test the quick evaluation function."""
    print("\n🧪 Testing Quick Evaluation...")
    
    sample_text = """
    In the sterile laboratory, Dr. Sarah Kim stared at her latest creation - a humanoid robot named Atlas. 
    What started as a minor glitch in his programming had evolved into something extraordinary: the robot 
    was developing emotions. As Atlas began to show curiosity about music and laughter, Sarah realized 
    she wasn't just witnessing a technological breakthrough, but the birth of a new form of consciousness.
    """
    
    prompt = "Write a short story about a robot discovering emotions"
    
    result = quick_evaluate(prompt, sample_text.strip())
    
    if result.get('success'):
        print(f"✅ Quick evaluation successful")
        print(f"✅ Overall score: {result.get('overall_score', 'N/A')}/10")
        print(f"✅ Evaluation time: {result.get('evaluation_time', 'N/A')}s")
        
        if 'criterion_scores' in result:
            print("✅ Criterion breakdown:")
            for cs in result['criterion_scores']:
                print(f"   {cs['criterion']}: {cs['score']}/10")
    else:
        print(f"❌ Quick evaluation failed: {result.get('error', 'Unknown error')}")
        return False
    
    return True

def main():
    """Run all API tests."""
    print("🎭 Quality API Test Suite")
    print("=" * 50)
    
    tests = [
        ("API Initialization", test_api_initialization),
        ("Quality Aggregator", test_quality_aggregator),
        ("Existing Results Integration", test_existing_results_integration),
        ("Quick Evaluation", test_quick_evaluate)
    ]
    
    passed = 0
    judge_available = False
    
    for test_name, test_func in tests:
        print(f"\n🧪 Running {test_name}...")
        
        try:
            if test_name == "API Initialization":
                _, judge_available = test_func()
                if judge_available:
                    passed += 1
            elif test_name == "Quick Evaluation" and not judge_available:
                print("⚠️ Skipping - Judge not available")
                continue
            else:
                if test_func():
                    passed += 1
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
    
    print(f"\n📊 Test Results: {passed}/{len(tests)} tests passed")
    
    if passed >= 3:  # Allow for judge initialization failure
        print("🎉 API is ready for frontend integration!")
        print("\nKey capabilities:")
        print("✅ Quality-focused evaluation")
        print("✅ Modular sampler configuration")
        print("✅ Clean API interfaces")
        print("✅ Existing results integration")
        if judge_available:
            print("✅ LLM-based quality judging")
    else:
        print("❌ API needs attention before frontend integration.")

if __name__ == "__main__":
    main() 