"""LLM-as-a-Judge evaluation system using OpenAI API."""

import os
import json
import time
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

@dataclass
class JudgmentScore:
    """Individual judgment score for a single criterion."""
    criterion: str
    score: float  # 1-10 scale
    reasoning: str
    
@dataclass
class JudgmentResult:
    """Complete judgment result for a text sample."""
    overall_score: float  # 1-10 scale
    criterion_scores: List[JudgmentScore]
    summary: str
    evaluation_time: float
    model_used: str

class CreativeWritingJudge:
    """LLM-based judge for creative writing evaluation."""
    
    def __init__(self, 
                 api_key: Optional[str] = None,
                 model: Optional[str] = None,
                 temperature: float = 0.1):
        """Initialize the judge with OpenAI API credentials.
        
        Args:
            api_key: OpenAI API key (defaults to env OPENAI_API_KEY)
            model: OpenAI model to use (defaults to env OPENAI_MODEL)
            temperature: Sampling temperature for consistent judging
        """
        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        self.model = model or os.getenv('OPENAI_MODEL', 'gpt-4o')
        self.temperature = temperature
        
        if not self.api_key:
            raise ValueError("OpenAI API key not found. Set OPENAI_API_KEY in .env file")
        
        # Initialize OpenAI client
        self.client = OpenAI(api_key=self.api_key)
        
        # Evaluation criteria for creative writing
        self.criteria = {
            'narrative_coherence': {
                'description': 'How well the story flows and maintains logical consistency',
                'weight': 0.25
            },
            'creativity_originality': {
                'description': 'Uniqueness of ideas, plot elements, and creative expression',
                'weight': 0.25
            },
            'character_development': {
                'description': 'Depth and believability of characters and their development',
                'weight': 0.20
            },
            'engagement_readability': {
                'description': 'How engaging and readable the text is for the audience',
                'weight': 0.20
            },
            'stylistic_quality': {
                'description': 'Writing style, language use, and literary technique',
                'weight': 0.10
            }
        }
    
    def judge_text(self, 
                   text: str, 
                   prompt: str,
                   sampler_config: Dict[str, Any]) -> JudgmentResult:
        """Judge a piece of creative writing text.
        
        Args:
            text: The generated text to evaluate
            prompt: The original prompt used for generation
            sampler_config: Configuration of the sampler used
            
        Returns:
            JudgmentResult with scores and analysis
        """
        start_time = time.time()
        
        # Create the judgment prompt
        judgment_prompt = self._create_judgment_prompt(text, prompt, sampler_config)
        
        try:
            # Call OpenAI API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self._get_system_prompt()},
                    {"role": "user", "content": judgment_prompt}
                ],
                temperature=self.temperature,
                max_tokens=1500
            )
            
            evaluation_time = time.time() - start_time
            
            # Parse the response
            judgment_text = response.choices[0].message.content
            judgment_result = self._parse_judgment(judgment_text, evaluation_time)
            
            return judgment_result
            
        except Exception as e:
            # Return a fallback result if API fails
            evaluation_time = time.time() - start_time
            return JudgmentResult(
                overall_score=5.0,  # Neutral score
                criterion_scores=[
                    JudgmentScore(criterion, 5.0, f"API Error: {str(e)}")
                    for criterion in self.criteria.keys()
                ],
                summary=f"Evaluation failed due to API error: {str(e)}",
                evaluation_time=evaluation_time,
                model_used=self.model
            )
    
    def _get_system_prompt(self) -> str:
        """Get the system prompt for the judge."""
        return """You are an expert literary critic and creative writing evaluator. Your task is to objectively assess creative writing samples based on specific criteria.

You will evaluate texts on a 1-10 scale for each criterion, where:
- 1-2: Poor quality with major issues
- 3-4: Below average with notable problems  
- 5-6: Average quality, adequate but unremarkable
- 7-8: Good quality with strong elements
- 9-10: Excellent quality, exceptional work

Be objective, consistent, and provide specific reasoning for your scores. Focus on the writing quality rather than personal preferences about content or themes.

Respond ONLY in the specified JSON format with no additional text."""
    
    def _create_judgment_prompt(self, text: str, prompt: str, sampler_config: Dict[str, Any]) -> str:
        """Create the judgment prompt for evaluation."""
        criteria_text = "\n".join([
            f"- **{criterion.replace('_', ' ').title()}**: {details['description']}"
            for criterion, details in self.criteria.items()
        ])
        
        sampler_info = f"Temperature: {sampler_config.get('temperature', 'N/A')}, " \
                      f"Sampler: {sampler_config.get('type', 'N/A')}"
        
        return f"""**TASK**: Evaluate the following creative writing sample based on the specified criteria.

**ORIGINAL PROMPT**: {prompt}

**GENERATED TEXT**:
{text}

**SAMPLING CONFIGURATION**: {sampler_info}

**EVALUATION CRITERIA**:
{criteria_text}

**INSTRUCTIONS**: 
1. Score each criterion on a 1-10 scale
2. Provide specific reasoning for each score
3. Calculate an overall weighted score
4. Give a brief summary assessment

**REQUIRED JSON RESPONSE FORMAT**:
{{
    "criterion_scores": {{
        "narrative_coherence": {{"score": X.X, "reasoning": "detailed explanation"}},
        "creativity_originality": {{"score": X.X, "reasoning": "detailed explanation"}},
        "character_development": {{"score": X.X, "reasoning": "detailed explanation"}},
        "engagement_readability": {{"score": X.X, "reasoning": "detailed explanation"}},
        "stylistic_quality": {{"score": X.X, "reasoning": "detailed explanation"}}
    }},
    "overall_score": X.X,
    "summary": "Brief 2-3 sentence assessment of the text's overall quality and notable strengths/weaknesses"
}}"""
    
    def _parse_judgment(self, judgment_text: str, evaluation_time: float) -> JudgmentResult:
        """Parse the judgment response from the LLM."""
        try:
            # Try to extract JSON from the response
            judgment_data = json.loads(judgment_text)
            
            # Extract criterion scores
            criterion_scores = []
            for criterion, details in judgment_data.get('criterion_scores', {}).items():
                score = JudgmentScore(
                    criterion=criterion,
                    score=float(details.get('score', 5.0)),
                    reasoning=details.get('reasoning', 'No reasoning provided')
                )
                criterion_scores.append(score)
            
            # Calculate overall score if not provided
            overall_score = float(judgment_data.get('overall_score', 5.0))
            if overall_score == 5.0 and criterion_scores:
                # Calculate weighted average
                weighted_sum = sum(
                    score.score * self.criteria.get(score.criterion, {}).get('weight', 0.2)
                    for score in criterion_scores
                )
                overall_score = weighted_sum
            
            return JudgmentResult(
                overall_score=overall_score,
                criterion_scores=criterion_scores,
                summary=judgment_data.get('summary', 'No summary provided'),
                evaluation_time=evaluation_time,
                model_used=self.model
            )
            
        except (json.JSONDecodeError, KeyError) as e:
            # Fallback parsing if JSON fails
            return JudgmentResult(
                overall_score=5.0,
                criterion_scores=[
                    JudgmentScore(criterion, 5.0, "Failed to parse judgment")
                    for criterion in self.criteria.keys()
                ],
                summary=f"Failed to parse judgment response: {str(e)}",
                evaluation_time=evaluation_time,
                model_used=self.model
            )
    
    def judge_batch(self, 
                    samples: List[Dict[str, Any]], 
                    batch_size: int = 5,
                    progress_callback: Optional[callable] = None) -> List[JudgmentResult]:
        """Judge multiple text samples using true API batching.
        
        Args:
            samples: List of sample dicts with 'text', 'prompt', and 'sampler_config'
            batch_size: Number of samples to evaluate in each API call
            progress_callback: Optional callback for progress updates
            
        Returns:
            List of JudgmentResult objects
        """
        all_results = []
        
        # Process samples in batches
        for batch_start in range(0, len(samples), batch_size):
            batch_end = min(batch_start + batch_size, len(samples))
            batch_samples = samples[batch_start:batch_end]
            
            if progress_callback:
                progress_callback(batch_start, len(samples))
            
            # Create batched prompt
            batch_prompt = self._create_batch_judgment_prompt(batch_samples)
            
            start_time = time.time()
            
            try:
                # Single API call for the batch
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": self._get_batch_system_prompt()},
                        {"role": "user", "content": batch_prompt}
                    ],
                    temperature=self.temperature,
                    max_tokens=2000 * len(batch_samples)  # Scale tokens with batch size
                )
                
                evaluation_time = time.time() - start_time
                
                # Parse batch response
                batch_results = self._parse_batch_judgment(
                    response.choices[0].message.content, 
                    batch_samples,
                    evaluation_time / len(batch_samples)  # Average time per sample
                )
                
                all_results.extend(batch_results)
                
                print(f"✅ Batched evaluation of {len(batch_samples)} samples ({evaluation_time:.1f}s)")
                
            except Exception as e:
                print(f"❌ Batch evaluation failed: {e}")
                # Fallback to individual evaluation for this batch
                for sample in batch_samples:
                    try:
                        result = self.judge_text(
                            text=sample['text'],
                            prompt=sample['prompt'],
                            sampler_config=sample.get('sampler_config', {})
                        )
                        all_results.append(result)
                    except Exception as e2:
                        # Create fallback result
                        all_results.append(JudgmentResult(
                            overall_score=5.0,
                            criterion_scores=[
                                JudgmentScore(criterion, 5.0, f"Evaluation failed: {str(e2)}")
                                for criterion in self.criteria.keys()
                            ],
                            summary=f"Evaluation failed: {str(e2)}",
                            evaluation_time=0.0,
                            model_used=self.model
                        ))
            
            # Brief pause between batches to respect rate limits
            if batch_end < len(samples):
                time.sleep(1.0)
        
        return all_results

    def _get_batch_system_prompt(self) -> str:
        """Get system prompt for batch evaluation."""
        return """You are an expert literary critic and creative writing evaluator. You will evaluate multiple creative writing samples in a single response.

For each sample, evaluate on a 1-10 scale where:
- 1-2: Poor quality with major issues
- 3-4: Below average with notable problems  
- 5-6: Average quality, adequate but unremarkable
- 7-8: Good quality with strong elements
- 9-10: Excellent quality, exceptional work

Be objective, consistent, and provide specific reasoning. Respond ONLY with valid JSON containing evaluations for all samples."""

    def _create_batch_judgment_prompt(self, batch_samples: List[Dict[str, Any]]) -> str:
        """Create a batched judgment prompt for multiple samples."""
        criteria_text = "\n".join([
            f"- **{criterion.replace('_', ' ').title()}**: {details['description']}"
            for criterion, details in self.criteria.items()
        ])
        
        # Build prompt for each sample in the batch
        samples_text = ""
        for i, sample in enumerate(batch_samples, 1):
            sampler_info = f"Temperature: {sample.get('sampler_config', {}).get('temperature', 'N/A')}, " \
                          f"Sampler: {sample.get('sampler_config', {}).get('type', 'N/A')}"
            
            samples_text += f"""
**SAMPLE {i}**:
Original Prompt: {sample['prompt']}
Sampling Config: {sampler_info}
Generated Text: {sample['text']}

"""
        
        return f"""**TASK**: Evaluate the following {len(batch_samples)} creative writing samples based on the specified criteria.

**EVALUATION CRITERIA**:
{criteria_text}

{samples_text}

**INSTRUCTIONS**: 
1. Score each sample on each criterion (1-10 scale)
2. Provide specific reasoning for scores
3. Calculate overall weighted scores
4. Provide brief summary assessments

**REQUIRED JSON RESPONSE FORMAT**:
{{
    "evaluations": [
        {{
            "sample_id": 1,
            "criterion_scores": {{
                "narrative_coherence": {{"score": X.X, "reasoning": "explanation"}},
                "creativity_originality": {{"score": X.X, "reasoning": "explanation"}},
                "character_development": {{"score": X.X, "reasoning": "explanation"}},
                "engagement_readability": {{"score": X.X, "reasoning": "explanation"}},
                "stylistic_quality": {{"score": X.X, "reasoning": "explanation"}}
            }},
            "overall_score": X.X,
            "summary": "brief assessment"
        }},
        ... (continue for all {len(batch_samples)} samples)
    ]
}}"""

    def _parse_batch_judgment(self, judgment_text: str, batch_samples: List[Dict[str, Any]], avg_eval_time: float) -> List[JudgmentResult]:
        """Parse batched judgment response."""
        try:
            judgment_data = json.loads(judgment_text)
            results = []
            
            evaluations = judgment_data.get('evaluations', [])
            
            for i, evaluation in enumerate(evaluations):
                if i >= len(batch_samples):
                    break
                    
                # Extract criterion scores
                criterion_scores = []
                for criterion, details in evaluation.get('criterion_scores', {}).items():
                    score = JudgmentScore(
                        criterion=criterion,
                        score=float(details.get('score', 5.0)),
                        reasoning=details.get('reasoning', 'No reasoning provided')
                    )
                    criterion_scores.append(score)
                
                # Calculate overall score if not provided
                overall_score = float(evaluation.get('overall_score', 5.0))
                if overall_score == 5.0 and criterion_scores:
                    weighted_sum = sum(
                        score.score * self.criteria.get(score.criterion, {}).get('weight', 0.2)
                        for score in criterion_scores
                    )
                    overall_score = weighted_sum
                
                result = JudgmentResult(
                    overall_score=overall_score,
                    criterion_scores=criterion_scores,
                    summary=evaluation.get('summary', 'No summary provided'),
                    evaluation_time=avg_eval_time,
                    model_used=self.model
                )
                results.append(result)
            
            # Fill in missing results if batch response was incomplete
            while len(results) < len(batch_samples):
                results.append(JudgmentResult(
                    overall_score=5.0,
                    criterion_scores=[
                        JudgmentScore(criterion, 5.0, "Incomplete batch response")
                        for criterion in self.criteria.keys()
                    ],
                    summary="Incomplete batch response",
                    evaluation_time=avg_eval_time,
                    model_used=self.model
                ))
            
            return results
            
        except (json.JSONDecodeError, KeyError) as e:
            print(f"⚠️ Failed to parse batch judgment, falling back to individual calls")
            # Fallback: return default scores for all samples
            return [
                JudgmentResult(
                    overall_score=5.0,
                    criterion_scores=[
                        JudgmentScore(criterion, 5.0, f"Batch parsing failed: {str(e)}")
                        for criterion in self.criteria.keys()
                    ],
                    summary=f"Batch parsing failed: {str(e)}",
                    evaluation_time=avg_eval_time,
                    model_used=self.model
                )
                for _ in batch_samples
            ]
    
    def get_criteria_info(self) -> Dict[str, Any]:
        """Get information about evaluation criteria."""
        return self.criteria 