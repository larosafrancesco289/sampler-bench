"""
Instruction Following Penalty System

Applies penalties to judgment scores based on instruction adherence:
- Word count deviations
- Empty generations  
- Meta-commentary detection
"""

import re
from typing import Dict, Any, List, Tuple
import logging

logger = logging.getLogger(__name__)

class InstructionPenaltyProcessor:
    """Processes instruction-following penalties for generated text samples."""
    
    def __init__(self, penalty_config: Dict[str, Any]):
        """Initialize with penalty configuration from benchmark config."""
        self.config = penalty_config
        self.enabled = penalty_config.get('enabled', True)
        
    def apply_penalties(self, 
                       judgment_result: Dict[str, Any], 
                       generated_text: str, 
                       word_count: int) -> Dict[str, Any]:
        """
        Apply instruction-following penalties to a judgment result.
        
        Args:
            judgment_result: Original judgment with scores
            generated_text: The generated text to analyze
            word_count: Word count of the generated text
            
        Returns:
            Modified judgment result with penalties applied
        """
        if not self.enabled:
            return judgment_result
            
        penalties = []
        total_penalty = 0.0
        
        # Word count penalty
        if 'word_count_penalty' in self.config and self.config['word_count_penalty']['enabled']:
            penalty_info = self._calculate_word_count_penalty(word_count)
            if penalty_info:
                penalties.append(penalty_info)
                total_penalty += penalty_info['penalty']
        
        # Empty generation penalty
        if 'empty_generation_penalty' in self.config and self.config['empty_generation_penalty']['enabled']:
            penalty_info = self._calculate_empty_generation_penalty(generated_text, word_count)
            if penalty_info:
                penalties.append(penalty_info)
                total_penalty += penalty_info['penalty']
        
        # Meta-commentary penalty
        if 'meta_commentary_penalty' in self.config and self.config['meta_commentary_penalty']['enabled']:
            penalty_info = self._calculate_meta_commentary_penalty(generated_text)
            if penalty_info:
                penalties.append(penalty_info)
                total_penalty += penalty_info['penalty']
        
        # Apply penalties to the judgment
        if penalties:
            modified_result = judgment_result.copy()
            
            # Adjust overall score
            original_score = modified_result['overall_score']
            penalized_score = max(1.0, original_score + total_penalty)  # Don't go below 1.0
            modified_result['overall_score'] = penalized_score
            
            # Add penalty information to the judgment
            modified_result['instruction_penalties'] = {
                'applied': True,
                'original_score': original_score,
                'total_penalty': total_penalty,
                'final_score': penalized_score,
                'penalties': penalties
            }
            
            # Update summary to include penalty info
            if 'summary' in modified_result:
                penalty_summary = f" | Penalties: {total_penalty:.1f} pts ({', '.join([p['type'] for p in penalties])})"
                modified_result['summary'] += penalty_summary
            
            logger.info(f"Applied instruction penalties: {total_penalty:.1f} points ({len(penalties)} penalties)")
            
            return modified_result
        
        # No penalties applied
        judgment_result['instruction_penalties'] = {'applied': False}
        return judgment_result
    
    def _calculate_word_count_penalty(self, word_count: int) -> Dict[str, Any]:
        """Calculate penalty for word count deviation."""
        config = self.config['word_count_penalty']
        target_min, target_max = config['target_range']
        
        if target_min <= word_count <= target_max:
            return None  # No penalty
        
        # Calculate deviation from target range
        if word_count < target_min:
            deviation = target_min - word_count
        else:  # word_count > target_max
            deviation = word_count - target_max
        
        # Determine penalty level
        penalties = config['penalties']
        
        if deviation > penalties['severe_deviation']['threshold']:
            penalty_amount = penalties['severe_deviation']['penalty']
            severity = 'severe'
        elif deviation > penalties['moderate_deviation']['threshold']:
            penalty_amount = penalties['moderate_deviation']['penalty']
            severity = 'moderate'
        elif deviation > penalties['minor_deviation']['threshold']:
            penalty_amount = penalties['minor_deviation']['penalty']
            severity = 'minor'
        else:
            return None  # Within acceptable range
        
        return {
            'type': 'word_count',
            'severity': severity,
            'penalty': penalty_amount,
            'details': {
                'word_count': word_count,
                'target_range': [target_min, target_max],
                'deviation': deviation
            },
            'description': f'{severity.title()} word count deviation: {word_count} words (target: {target_min}-{target_max})'
        }
    
    def _calculate_empty_generation_penalty(self, generated_text: str, word_count: int) -> Dict[str, Any]:
        """Calculate penalty for empty or failed generation."""
        config = self.config['empty_generation_penalty']
        
        # Check for empty generation
        if word_count == 0 or not generated_text.strip():
            return {
                'type': 'empty_generation',
                'severity': 'critical',
                'penalty': config['penalty'],
                'details': {
                    'word_count': word_count,
                    'text_length': len(generated_text.strip())
                },
                'description': 'Empty or failed text generation'
            }
        
        return None
    
    def _calculate_meta_commentary_penalty(self, generated_text: str) -> Dict[str, Any]:
        """Calculate penalty for meta-commentary in generated text."""
        config = self.config['meta_commentary_penalty']
        patterns = config['detection_patterns']
        
        # Check for meta-commentary patterns
        text_lower = generated_text.lower()
        detected_patterns = []
        
        for pattern in patterns:
            if pattern.lower() in text_lower:
                detected_patterns.append(pattern)
        
        if detected_patterns:
            return {
                'type': 'meta_commentary',
                'severity': 'moderate',
                'penalty': config['penalty'],
                'details': {
                    'detected_patterns': detected_patterns,
                    'pattern_count': len(detected_patterns)
                },
                'description': f'Meta-commentary detected: {', '.join(detected_patterns)}'
            }
        
        return None

def apply_instruction_penalties(judgment_result: Dict[str, Any], 
                              generated_text: str, 
                              word_count: int,
                              penalty_config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convenience function to apply instruction penalties.
    
    Args:
        judgment_result: Original judgment result
        generated_text: Generated text to analyze
        word_count: Word count of generated text
        penalty_config: Penalty configuration
        
    Returns:
        Modified judgment result with penalties applied
    """
    processor = InstructionPenaltyProcessor(penalty_config)
    return processor.apply_penalties(judgment_result, generated_text, word_count)