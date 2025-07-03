"""Multi-Judge evaluation system using OpenRouter API for enhanced reliability."""

import os
import json
import time
import statistics
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from openai import OpenAI
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, as_completed

# Load environment variables
load_dotenv()

@dataclass
class JudgeScore:
    """Individual judge score for a single criterion."""
    criterion: str
    score: float  # 1-10 scale
    reasoning: str
    judge_model: str

@dataclass
class ConsensusScore:
    """Consensus score across multiple judges."""
    criterion: str
    mean_score: float
    std_score: float
    individual_scores: List[float]
    individual_reasoning: List[str]
    judge_models: List[str]
    consensus_strength: float  # 0-1, higher = more agreement

@dataclass
class MultiJudgeResult:
    """Complete multi-judge evaluation result."""
    overall_score: float  # Consensus overall score
    overall_std: float    # Standard deviation of overall scores
    criterion_scores: List[ConsensusScore]
    summary: str
    evaluation_time: float
    judge_models: List[str]
    judge_count: int
    consensus_method: str
    individual_results: List[Dict[str, Any]]  # Raw individual judge results

class MultiJudgeEvaluator:
    """Multi-judge evaluation system using OpenRouter for enhanced reliability."""
    
    def __init__(self, 
                 api_key: Optional[str] = None,
                 judge_models: Optional[List[str]] = None,
                 consensus_method: str = "average",
                 temperature: float = 0.2):
        """Initialize the multi-judge system.
        
        Args:
            api_key: OpenRouter API key (defaults to env OPENROUTER_API_KEY)
            judge_models: List of models to use as judges (defaults to env LLM_JUDGE_MODELS)
            consensus_method: How to combine scores ('average', 'weighted_average', 'majority_vote')
            temperature: Sampling temperature for consistent judging
        """
        self.api_key = api_key or os.getenv('OPENROUTER_API_KEY') or os.getenv('LLM_JUDGE_API_KEY')
        self.consensus_method = consensus_method or os.getenv('JUDGE_CONSENSUS_METHOD', 'average')
        self.temperature = temperature
        
        # Parse judge models from environment or parameter
        if judge_models:
            self.judge_models = judge_models
        else:
            models_str = os.getenv('LLM_JUDGE_MODELS', os.getenv('LLM_JUDGE_MODEL', 'openai/gpt-4-turbo'))
            self.judge_models = [m.strip() for m in models_str.split(',')]
        
        if not self.api_key:
            raise ValueError("API key not found. Set OPENROUTER_API_KEY in .env file")
        
        # Initialize OpenRouter client (uses OpenAI-compatible interface)
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=self.api_key
        )
        
        # Evaluation criteria for creative writing
        self.criteria = {
            'narrative_structure': {
                'description': 'Story organization, pacing, and plot coherence',
                'weight': 0.30
            },
            'creativity_execution': {
                'description': 'Creative premise handling and original elements',
                'weight': 0.25
            },
            'character_voice': {
                'description': 'Character development and authentic voice',
                'weight': 0.20
            },
            'prose_quality': {
                'description': 'Writing craft, style, and language use',
                'weight': 0.15
            },
            'engagement': {
                'description': 'Reader interest and emotional impact',
                'weight': 0.10
            }
        }
        
        # JSON Schema for structured outputs
        self.evaluation_schema = {
            "type": "object",
            "properties": {
                "criterion_scores": {
                    "type": "object",
                    "properties": {
                        "narrative_structure": {
                            "type": "object",
                            "properties": {
                                "score": {"type": "number", "minimum": 1.0, "maximum": 10.0},
                                "reasoning": {"type": "string"}
                            },
                            "required": ["score", "reasoning"],
                            "additionalProperties": False
                        },
                        "creativity_execution": {
                            "type": "object", 
                            "properties": {
                                "score": {"type": "number", "minimum": 1.0, "maximum": 10.0},
                                "reasoning": {"type": "string"}
                            },
                            "required": ["score", "reasoning"],
                            "additionalProperties": False
                        },
                        "character_voice": {
                            "type": "object",
                            "properties": {
                                "score": {"type": "number", "minimum": 1.0, "maximum": 10.0},
                                "reasoning": {"type": "string"}
                            },
                            "required": ["score", "reasoning"],
                            "additionalProperties": False
                        },
                        "prose_quality": {
                            "type": "object",
                            "properties": {
                                "score": {"type": "number", "minimum": 1.0, "maximum": 10.0},
                                "reasoning": {"type": "string"}
                            },
                            "required": ["score", "reasoning"],
                            "additionalProperties": False
                        },
                        "engagement": {
                            "type": "object",
                            "properties": {
                                "score": {"type": "number", "minimum": 1.0, "maximum": 10.0},
                                "reasoning": {"type": "string"}
                            },
                            "required": ["score", "reasoning"],
                            "additionalProperties": False
                        }
                    },
                    "required": ["narrative_structure", "creativity_execution", "character_voice", "prose_quality", "engagement"],
                    "additionalProperties": False
                },
                "overall_score": {
                    "type": "number",
                    "minimum": 1.0,
                    "maximum": 10.0,
                    "description": "Overall weighted score based on all criteria"
                },
                "summary": {
                    "type": "string",
                    "description": "Brief 2-3 sentence assessment of the text's overall quality and notable strengths/weaknesses"
                }
            },
            "required": ["criterion_scores", "overall_score", "summary"],
            "additionalProperties": False
        }
        
        # Models that support structured outputs (based on OpenRouter documentation)
        self.structured_output_models = {
            # OpenAI models (GPT-4o and later)
            'openai/gpt-4o',
            'openai/gpt-4o-mini', 
            'openai/gpt-4o-2024-08-06',
            'openai/gpt-4o-2024-11-20',
            'openai/gpt-4-turbo',
            'openai/gpt-4-turbo-2024-04-09',
            'openai/gpt-4.1-nano',  # This one we're currently using
            'openai/chatgpt-4o-latest',
            # Google Gemini models that support structured outputs
            'google/gemini-2.0-flash-001',
            'google/gemini-2.0-flash-lite-001',
            'google/gemini-2.5-flash-preview',
            'google/gemini-2.5-flash-preview-04-17',
            'google/gemini-2.5-flash-preview-05-20',
            'google/gemini-2.5-pro-preview',
            'google/gemini-2.5-pro-preview-03-25',
            # Mistral models (newer models likely support structured outputs)
            'mistralai/mistral-small-3.2-24b-instruct',
            'mistralai/mistral-small-24b-instruct-2501',
            'mistralai/mistral-medium-3',
            'mistralai/ministral-8b',
            # Fireworks models (all Fireworks models support it)
            'fireworks/',  # Any model starting with fireworks/
        }
        
        print(f"🔧 MultiJudge initialized with {len(self.judge_models)} judges:")
        for i, model in enumerate(self.judge_models, 1):
            structured = self._supports_structured_outputs(model)
            print(f"   {i}. {model} {'(structured)' if structured else '(text)'}")
        print(f"📊 Consensus method: {self.consensus_method}")
    
    def _supports_structured_outputs(self, model: str) -> bool:
        """Check if a model supports structured outputs."""
        # Exact match first
        if model in self.structured_output_models:
            return True
        
        # Check prefixes (like fireworks/)
        for supported_model in self.structured_output_models:
            if supported_model.endswith('/') and model.startswith(supported_model):
                return True
                
        return False
    
    def evaluate_text(self, 
                     text: str, 
                     prompt: str,
                     sampler_config: Dict[str, Any]) -> MultiJudgeResult:
        """Evaluate text using multiple judges and combine results.
        
        Args:
            text: The generated text to evaluate
            prompt: The original prompt used for generation
            sampler_config: Configuration of the sampler used
            
        Returns:
            MultiJudgeResult with consensus scores and individual judge results
        """
        start_time = time.time()
        
        print(f"⚖️ Evaluating with {len(self.judge_models)} judges...")
        
        # Get judgments from all judges in parallel
        individual_results = self._get_parallel_judgments(text, prompt, sampler_config)
        
        # Calculate consensus scores
        consensus_scores = self._calculate_consensus(individual_results)
        
        # Calculate overall consensus score
        overall_scores = [result['overall_score'] for result in individual_results]
        overall_mean = statistics.mean(overall_scores)
        overall_std = statistics.stdev(overall_scores) if len(overall_scores) > 1 else 0.0
        
        # Generate summary
        summary = self._generate_consensus_summary(individual_results, consensus_scores)
        
        evaluation_time = time.time() - start_time
        
        return MultiJudgeResult(
            overall_score=overall_mean,
            overall_std=overall_std,
            criterion_scores=consensus_scores,
            summary=summary,
            evaluation_time=evaluation_time,
            judge_models=self.judge_models,
            judge_count=len(self.judge_models),
            consensus_method=self.consensus_method,
            individual_results=individual_results
        )
    
    def _get_parallel_judgments(self, text: str, prompt: str, sampler_config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get judgments from all judges in parallel."""
        individual_results = []
        
        # Use ThreadPoolExecutor for parallel API calls
        with ThreadPoolExecutor(max_workers=min(len(self.judge_models), 5)) as executor:
            # Submit all judge tasks
            future_to_model = {
                executor.submit(self._single_judge_evaluation, model, text, prompt, sampler_config): model
                for model in self.judge_models
            }
            
            # Collect results as they complete
            for future in as_completed(future_to_model):
                model = future_to_model[future]
                try:
                    result = future.result()
                    individual_results.append(result)
                    print(f"   ✅ {model}: {result['overall_score']:.2f}/10")
                except Exception as e:
                    print(f"   ❌ {model}: Failed ({str(e)})")
                    # Add fallback result
                    individual_results.append(self._create_fallback_result(model, str(e)))
        
        return individual_results
    
    def _single_judge_evaluation(self, model: str, text: str, prompt: str, sampler_config: Dict[str, Any]) -> Dict[str, Any]:
        """Get evaluation from a single judge model."""
        judgment_prompt = self._create_judgment_prompt(text, prompt, sampler_config)
        
        try:
            # Prepare base request parameters
            request_params = {
                "model": model,
                "messages": [
                    {"role": "system", "content": self._get_system_prompt()},
                    {"role": "user", "content": judgment_prompt}
                ],
                "temperature": self.temperature,
                "max_tokens": 1500
            }
            
            # Add structured outputs if supported by the model
            if self._supports_structured_outputs(model):
                request_params["response_format"] = {
                    "type": "json_schema",
                    "json_schema": {
                        "name": "creative_writing_evaluation",
                        "strict": True,
                        "schema": self.evaluation_schema
                    }
                }
                print(f"   🔧 Using structured outputs for {model}")
            else:
                print(f"   📝 Using text parsing for {model}")
            
            response = self.client.chat.completions.create(**request_params)
            
            judgment_text = response.choices[0].message.content
            result = self._parse_judgment(judgment_text, model)
            return result
            
        except Exception as e:
            print(f"   ❌ {model} failed: {str(e)}")
            # Return fallback result for this judge
            return self._create_fallback_result(model, str(e))
    
    def _create_fallback_result(self, model: str, error: str) -> Dict[str, Any]:
        """Create a fallback result when a judge fails."""
        return {
            'judge_model': model,
            'overall_score': 5.0,  # Neutral score
            'criterion_scores': {
                criterion: {'score': 5.0, 'reasoning': f"Judge failed: {error}"}
                for criterion in self.criteria.keys()
            },
            'summary': f"Evaluation failed for {model}: {error}",
            'error': error
        }
    
    def _calculate_consensus(self, individual_results: List[Dict[str, Any]]) -> List[ConsensusScore]:
        """Calculate consensus scores across all judges."""
        consensus_scores = []
        
        for criterion in self.criteria.keys():
            # Extract scores for this criterion from all judges
            scores = []
            reasoning = []
            models = []
            
            for result in individual_results:
                if criterion in result['criterion_scores']:
                    scores.append(result['criterion_scores'][criterion]['score'])
                    reasoning.append(result['criterion_scores'][criterion]['reasoning'])
                    models.append(result['judge_model'])
            
            if scores:
                mean_score = statistics.mean(scores)
                std_score = statistics.stdev(scores) if len(scores) > 1 else 0.0
                
                # Calculate consensus strength (inverse of coefficient of variation)
                consensus_strength = 1.0 - (std_score / mean_score) if mean_score > 0 else 0.0
                consensus_strength = max(0.0, min(1.0, consensus_strength))  # Clamp to [0,1]
                
                consensus_scores.append(ConsensusScore(
                    criterion=criterion,
                    mean_score=mean_score,
                    std_score=std_score,
                    individual_scores=scores,
                    individual_reasoning=reasoning,
                    judge_models=models,
                    consensus_strength=consensus_strength
                ))
        
        return consensus_scores
    
    def _generate_consensus_summary(self, individual_results: List[Dict[str, Any]], consensus_scores: List[ConsensusScore]) -> str:
        """Generate a summary of the consensus evaluation."""
        overall_scores = [r['overall_score'] for r in individual_results]
        overall_mean = statistics.mean(overall_scores)
        overall_std = statistics.stdev(overall_scores) if len(overall_scores) > 1 else 0.0
        
        # Find highest and lowest scoring criteria
        sorted_criteria = sorted(consensus_scores, key=lambda x: x.mean_score, reverse=True)
        best_criterion = sorted_criteria[0] if sorted_criteria else None
        worst_criterion = sorted_criteria[-1] if sorted_criteria else None
        
        # Calculate average consensus strength
        avg_consensus = statistics.mean([cs.consensus_strength for cs in consensus_scores]) if consensus_scores else 0.0
        
        summary_parts = [
            f"Multi-judge consensus score: {overall_mean:.2f}±{overall_std:.2f}/10 ({len(individual_results)} judges)."
        ]
        
        if best_criterion:
            summary_parts.append(f"Strongest area: {best_criterion.criterion.replace('_', ' ')} ({best_criterion.mean_score:.2f}/10).")
        
        if worst_criterion and worst_criterion != best_criterion:
            summary_parts.append(f"Weakest area: {worst_criterion.criterion.replace('_', ' ')} ({worst_criterion.mean_score:.2f}/10).")
        
        summary_parts.append(f"Judge consensus: {avg_consensus:.2f}/1.0 ({'high' if avg_consensus > 0.8 else 'moderate' if avg_consensus > 0.6 else 'low'} agreement).")
        
        return " ".join(summary_parts)
    
    def _get_system_prompt(self) -> str:
        """Get the system prompt for judges."""
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
        "narrative_structure": {{"score": X.X, "reasoning": "detailed explanation"}},
        "creativity_execution": {{"score": X.X, "reasoning": "detailed explanation"}},
        "character_voice": {{"score": X.X, "reasoning": "detailed explanation"}},
        "prose_quality": {{"score": X.X, "reasoning": "detailed explanation"}},
        "engagement": {{"score": X.X, "reasoning": "detailed explanation"}}
    }},
    "overall_score": X.X,
    "summary": "Brief 2-3 sentence assessment of the text's overall quality and notable strengths/weaknesses"
}}"""
    
    def _parse_judgment(self, judgment_text: str, model: str) -> Dict[str, Any]:
        """Parse the judgment response from an LLM judge."""
        try:
            # First try direct JSON parsing (for structured outputs)
            judgment_data = json.loads(judgment_text)
            
        except json.JSONDecodeError:
            # Try to extract JSON from text (for models without structured outputs)
            judgment_data = self._extract_json_from_text(judgment_text)
            
            if judgment_data is None:
                # If all parsing fails, create a fallback result
                return self._create_fallback_result(model, "Invalid JSON response")
        
        # Build result structure
        result = {
            'judge_model': model,
            'overall_score': float(judgment_data.get('overall_score', 5.0)),
            'criterion_scores': {},
            'summary': judgment_data.get('summary', 'No summary provided')
        }
        
        # Extract criterion scores
        for criterion, details in judgment_data.get('criterion_scores', {}).items():
            result['criterion_scores'][criterion] = {
                'score': float(details.get('score', 5.0)),
                'reasoning': details.get('reasoning', 'No reasoning provided')
            }
        
        return result
    
    def _extract_json_from_text(self, text: str) -> Optional[Dict[str, Any]]:
        """Extract JSON from text that might contain code blocks or extra text."""
        import re
        
        # Strategy 1: Look for JSON in code blocks
        code_block_patterns = [
            r'```json\s*(\{.*?\})\s*```',
            r'```\s*(\{.*?\})\s*```',
            r'`(\{.*?\})`',
        ]
        
        for pattern in code_block_patterns:
            match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
            if match:
                try:
                    return json.loads(match.group(1))
                except json.JSONDecodeError:
                    continue
        
        # Strategy 2: Look for JSON object patterns in the text
        json_patterns = [
            r'\{(?:[^{}]|{[^{}]*})*\}',  # Basic nested JSON pattern
        ]
        
        for pattern in json_patterns:
            matches = re.findall(pattern, text, re.DOTALL)
            for match in matches:
                try:
                    parsed = json.loads(match)
                    # Validate it has the expected structure
                    if (isinstance(parsed, dict) and 
                        ('criterion_scores' in parsed or 'overall_score' in parsed)):
                        return parsed
                except json.JSONDecodeError:
                    continue
        
        # Strategy 3: Try to find and repair common JSON issues
        # Look for something that looks like JSON and try to fix it
        json_like = re.search(r'\{.*\}', text, re.DOTALL)
        if json_like:
            json_text = json_like.group(0)
            
            # Common fixes for malformed JSON
            fixes = [
                # Fix missing quotes around keys
                (r'(\w+):', r'"\1":'),
                # Fix single quotes to double quotes
                (r"'([^']*)'", r'"\1"'),
                # Fix trailing commas
                (r',(\s*[}\]])', r'\1'),
            ]
            
            for find, replace in fixes:
                json_text = re.sub(find, replace, json_text)
            
            try:
                return json.loads(json_text)
            except json.JSONDecodeError:
                pass
        
        # Strategy 4: Create a minimal valid response from text analysis
        # Look for scores in the text even if JSON is completely broken
        score_matches = re.findall(r'(\d+(?:\.\d+)?)/10', text)
        if score_matches:
            try:
                scores = [float(s) for s in score_matches]
                avg_score = sum(scores) / len(scores) if scores else 5.0
                
                return {
                    'overall_score': avg_score,
                    'criterion_scores': {
                        criterion: {
                            'score': avg_score,
                            'reasoning': f'Extracted from text analysis: {avg_score:.1f}/10'
                        }
                        for criterion in self.criteria.keys()
                    },
                    'summary': 'Score extracted from malformed response text'
                }
            except (ValueError, TypeError):
                pass
        
        return None
    
    def get_criteria_info(self) -> Dict[str, Any]:
        """Get information about evaluation criteria."""
        return self.criteria

# Legacy compatibility function
def create_judge(multi_judge_enabled: Optional[bool] = None) -> Any:
    """Factory function to create appropriate judge based on environment."""
    if multi_judge_enabled is None:
        multi_judge_enabled = os.getenv('MULTI_JUDGE_ENABLED', 'false').lower() == 'true'
    
    if multi_judge_enabled:
        return MultiJudgeEvaluator()
    else:
        # Fall back to single judge (import here to avoid circular dependencies)
        from .llm_judge import CreativeWritingJudge
        return CreativeWritingJudge() 