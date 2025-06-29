# LLM-as-a-Judge Setup Guide

## Required Environment Variables

To use the LLM judging functionality, add these variables to your `.env` file:

```bash
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o
```

## Installation

Install the additional dependencies:

```bash
pip install openai>=1.0.0 python-dotenv>=1.0.0
```

Or install all requirements:

```bash
pip install -r requirements.txt
```

## Usage

Run the comprehensive benchmark with LLM judging:

```bash
python test_creative_writing_with_judge.py
```

This will:
1. Generate text samples using all configured sampling strategies
2. Evaluate each sample using OpenAI GPT as a judge
3. Provide comprehensive quality and performance rankings
4. Save detailed results to the `results/` directory

## Evaluation Criteria

The judge evaluates creative writing on 5 criteria:

1. **Narrative Coherence** (25% weight) - Story flow and logical consistency
2. **Creativity & Originality** (25% weight) - Unique ideas and creative expression  
3. **Character Development** (20% weight) - Depth and believability of characters
4. **Engagement & Readability** (20% weight) - How engaging the text is
5. **Stylistic Quality** (10% weight) - Writing style and language use

Each criterion is scored on a 1-10 scale, with an overall weighted score calculated.

## Cost Considerations

- Each text sample costs approximately $0.01-0.03 to judge (depending on length)
- A full benchmark (35 samples) costs roughly $0.35-1.05
- Consider using shorter samples or fewer prompts for cost optimization

## Supported Models

The judge works with any OpenAI model, but recommended models:
- `gpt-4o` - Best quality, reasonable cost
- `gpt-4o-mini` - Lower cost, good quality  
- `gpt-3.5-turbo` - Budget option 