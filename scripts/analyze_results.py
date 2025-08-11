#!/usr/bin/env python3
"""
Analyze benchmark results with nice formatting.
Usage: python scripts/analyze_results.py [results_file.json] [--detailed]
"""

import json
import sys
import argparse
from pathlib import Path

def analyze_results(filepath, detailed=False):
    """Analyze benchmark results and print formatted statistics."""
    
    with open(filepath, 'r') as f:
        data = json.load(f)
    
    print("=" * 60)
    print(f"BENCHMARK ANALYSIS: {data['model_name']}")
    print("=" * 60)
    
    # Basic overview
    meta = data['metadata']
    print(f"Completion: {meta['completed_samples']}/{meta['total_samples']} samples")
    print(f"Failures: {meta['failed_samples']}")
    print(f"Configuration: {meta['total_samplers']} samplers x {meta['total_prompts']} prompts x {meta['repetitions']} reps")
    
    # Judge metadata
    jm = data['judgment_metadata']
    print(f"Judgment: {jm['judge_type']} ({jm['successfully_judged']}/{jm['total_samples']} judged)")
    if jm['judgment_failures'] > 0:
        print(f"Judge failures: {jm['judgment_failures']}")
    
    # Word count analysis
    word_counts = [sample['word_count'] for sample in data['samples']]
    print(f"\nWORD COUNTS:")
    print(f"   Range: {min(word_counts)} - {max(word_counts)} words")
    print(f"   Average: {sum(word_counts)/len(word_counts):.1f} words")
    
    # Identify problematic samples
    zero_words = sum(1 for wc in word_counts if wc == 0)
    too_long = sum(1 for wc in word_counts if wc > 500)
    too_short = sum(1 for wc in word_counts if wc < 200)
    
    if zero_words + too_long + too_short > 0:
        print(f"Issues: {zero_words} empty, {too_short} too short (<200), {too_long} too long (>500)")
    
    # Score analysis
    scores = [sample['judgment']['overall_score'] for sample in data['samples']]
    print(f"\nQUALITY SCORES:")
    print(f"   Range: {min(scores):.2f} - {max(scores):.2f}")
    print(f"   Average: {sum(scores)/len(scores):.2f}")
    
    # Check for penalty information
    penalty_samples = [sample for sample in data['samples'] 
                      if 'instruction_penalties' in sample['judgment'] 
                      and sample['judgment']['instruction_penalties'].get('applied', False)]
    
    if penalty_samples:
        total_penalty = sum(s['judgment']['instruction_penalties']['total_penalty'] for s in penalty_samples)
        print(f"Penalties applied: {len(penalty_samples)}/{len(data['samples'])} samples (avg: {total_penalty/len(penalty_samples):.1f} pts)")
    
    # Sampler performance
    print(f"\nSAMPLER PERFORMANCE:")
    sampler_stats = {}
    for sample in data['samples']:
        sampler = sample['sampler_name']
        score = sample['judgment']['overall_score']
        wc = sample['word_count']
        
        if sampler not in sampler_stats:
            sampler_stats[sampler] = {'scores': [], 'word_counts': [], 'issues': 0}
        
        sampler_stats[sampler]['scores'].append(score)
        sampler_stats[sampler]['word_counts'].append(wc)
        
        # Count issues
        if wc == 0 or wc > 500 or wc < 200:
            sampler_stats[sampler]['issues'] += 1
    
    # Sort by average score
    sorted_samplers = sorted(sampler_stats.items(), key=lambda x: sum(x[1]['scores'])/len(x[1]['scores']), reverse=True)
    
    for sampler, stats in sorted_samplers:
        avg_score = sum(stats['scores']) / len(stats['scores'])
        avg_words = sum(stats['word_counts']) / len(stats['word_counts'])
        issue_str = f" ({stats['issues']} issues)" if stats['issues'] > 0 else ""
        print(f"   {sampler:<15} {avg_score:.2f} avg  |  {avg_words:.0f} words{issue_str}")
    
    # Judge consensus (if available)
    consensus_scores = []
    for sample in data['samples']:
        if 'criterion_scores' in sample['judgment'] and sample['judgment']['criterion_scores']:
            if 'consensus_strength' in sample['judgment']['criterion_scores'][0]:
                consensus = sample['judgment']['criterion_scores'][0]['consensus_strength']
                consensus_scores.append(consensus)
    
    if consensus_scores:
        avg_consensus = sum(consensus_scores) / len(consensus_scores)
        print(f"\nJUDGE CONSENSUS: {avg_consensus:.3f} average")
        if avg_consensus < 0.7:
            print("   Low consensus - judges disagree frequently")
        elif avg_consensus > 0.9:
            print("   High consensus - judges agree well")
    
    if detailed:
        print(f"\nDETAILED ISSUES:")
        issue_count = 0
        for i, sample in enumerate(data['samples']):
            wc = sample['word_count']
            score = sample['judgment']['overall_score']
            sampler = sample['sampler_name']
            
            issues = []
            if wc == 0:
                issues.append("EMPTY")
            elif wc > 500:
                issues.append(f"LONG({wc}w)")
            elif wc < 200:
                issues.append(f"SHORT({wc}w)")
            
            if score < 4.0:
                issues.append(f"LOW_SCORE({score:.1f})")
            
            if issues:
                issue_count += 1
                print(f"   Sample {i+1:3d}: {' | '.join(issues)} ({sampler})")
                if issue_count >= 10:
                    remaining = sum(1 for s in data['samples'][i+1:] if s['word_count'] == 0 or s['word_count'] > 500 or s['word_count'] < 200 or s['judgment']['overall_score'] < 4.0)
                    if remaining > 0:
                        print(f"   ... and {remaining} more issues")
                    break
    
    print("=" * 60)

def main():
    parser = argparse.ArgumentParser(description='Analyze benchmark results')
    parser.add_argument('file', nargs='?', help='Results JSON file (auto-detects latest if not provided)')
    parser.add_argument('--detailed', '-d', action='store_true', help='Show detailed issue breakdown')
    
    args = parser.parse_args()
    
    if args.file:
        filepath = args.file
    else:
        # Find latest judged results file
        results_dir = Path('results')
        if not results_dir.exists():
            print("No results directory found")
            return 1
        
        judged_files = list(results_dir.glob('*_judged_*.json'))
        if not judged_files:
            print("No judged results files found")
            return 1
        
        # Sort by modification time, get latest
        filepath = max(judged_files, key=lambda p: p.stat().st_mtime)
        print(f"Auto-detected latest results: {filepath}")
    
    try:
        analyze_results(filepath, args.detailed)
        return 0
    except Exception as e:
        print(f"Error analyzing results: {e}")
        return 1

if __name__ == '__main__':
    sys.exit(main())