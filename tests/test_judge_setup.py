"""
Simple test to validate LLM judge setup.
This test checks if the environment is configured correctly for judging.
"""

import os
import sys
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent / "backend"))

def test_environment():
    """Test if environment variables are set up correctly."""
    print("🧪 Testing LLM Judge Environment Setup")
    print("=" * 50)
    
    # Check for .env file
    env_file = Path(".env")
    if env_file.exists():
        print("✅ .env file found")
    else:
        print("❌ .env file not found - create one based on environment.example")
        return False
    
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    # Check OpenAI API key
    api_key = os.getenv('OPENAI_API_KEY')
    if api_key and api_key != 'your_openai_api_key_here':
        print("✅ OPENAI_API_KEY is set")
    else:
        print("❌ OPENAI_API_KEY not set or using placeholder value")
        return False
    
    # Check OpenAI model
    model = os.getenv('OPENAI_MODEL', 'gpt-4o')
    print(f"✅ Using OpenAI model: {model}")
    
    return True

def test_judge_import():
    """Test if the judge can be imported and initialized."""
    try:
        from evaluation.llm_judge import CreativeWritingJudge
        print("✅ LLM judge module imported successfully")
        
        # Try to initialize (without making API calls)
        judge = CreativeWritingJudge()
        print(f"✅ Judge initialized with model: {judge.model}")
        
        # Check criteria
        criteria = judge.get_criteria_info()
        print(f"✅ {len(criteria)} evaluation criteria loaded")
        for criterion, info in criteria.items():
            print(f"   - {criterion}: {info['weight']*100:.0f}% weight")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to import or initialize judge: {e}")
        return False

def test_aggregator():
    """Test if the results aggregator works."""
    try:
        from evaluation.aggregator import ResultsAggregator, SampleResult
        print("✅ Results aggregator imported successfully")
        
        # Create a test aggregator
        aggregator = ResultsAggregator()
        
        # Add a dummy sample
        aggregator.add_sample(
            prompt="Test prompt",
            sampler_config={"temperature": 0.7},
            sampler_name="test_sampler",
            model_name="test_model",
            generated_text="This is test text.",
            generation_time=1.0,
            tokens_per_second=50.0
        )
        
        # Test stats calculation
        perf_stats = aggregator.calculate_performance_stats()
        print(f"✅ Performance stats calculated: {len(perf_stats)} samplers")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to test aggregator: {e}")
        return False

def main():
    """Run all tests."""
    tests = [
        ("Environment Setup", test_environment),
        ("Judge Import", test_judge_import), 
        ("Results Aggregator", test_aggregator)
    ]
    
    passed = 0
    for test_name, test_func in tests:
        print(f"\n🧪 Testing {test_name}...")
        if test_func():
            passed += 1
        else:
            print(f"❌ {test_name} failed")
    
    print(f"\n📊 Test Results: {passed}/{len(tests)} tests passed")
    
    if passed == len(tests):
        print("🎉 All tests passed! You're ready to use the LLM judge.")
        print("\nNext steps:")
        print("1. Make sure your Llama model is running")
        print("2. Run: python test_creative_writing_with_judge.py")
    else:
        print("❌ Some tests failed. Please fix the issues above.")
        print("\nTroubleshooting:")
        print("1. Make sure you have a .env file with OPENAI_API_KEY")
        print("2. Install dependencies: pip install -r requirements.txt")
        print("3. Check the JUDGE_SETUP.md file for detailed instructions")

if __name__ == "__main__":
    main() 