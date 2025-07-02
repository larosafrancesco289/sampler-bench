#!/usr/bin/env python3
"""
Hyperparameter Search Results Analyzer

Analyzes and visualizes results from hyperparameter searches to provide
insights about optimal sampler configurations and parameter importance.
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Dict, List, Any, Tuple
import glob
import statistics

def load_search_results(filepath: str) -> Dict[str, Any]:
    """Load search results from JSON file."""
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ Error loading results: {e}")
        sys.exit(1)

def analyze_sampler_performance(results: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    """Analyze performance by sampler type."""
    sampler_stats = {}
    
    for result in results:
        sampler_type = result['sampler_type']
        mean_score = result['mean_score']
        
        if sampler_type not in sampler_stats:
            sampler_stats[sampler_type] = {'scores': [], 'configs': []}
        
        sampler_stats[sampler_type]['scores'].append(mean_score)
        sampler_stats[sampler_type]['configs'].append(result)
    
    # Calculate statistics for each sampler type
    analysis = {}
    for sampler_type, data in sampler_stats.items():
        scores = data['scores']
        analysis[sampler_type] = {
            'mean': statistics.mean(scores),
            'median': statistics.median(scores),
            'std': statistics.stdev(scores) if len(scores) > 1 else 0,
            'min': min(scores),
            'max': max(scores),
            'count': len(scores),
            'best_config': max(data['configs'], key=lambda x: x['mean_score'])
        }
    
    return analysis

def analyze_parameter_importance(results: List[Dict[str, Any]]) -> Dict[str, Dict[str, float]]:
    """Analyze which parameters have the most impact on performance."""
    parameter_impact = {}
    
    # Group by sampler type first
    by_sampler = {}
    for result in results:
        sampler_type = result['sampler_type']
        if sampler_type not in by_sampler:
            by_sampler[sampler_type] = []
        by_sampler[sampler_type].append(result)
    
    # Analyze parameter impact within each sampler type
    for sampler_type, sampler_results in by_sampler.items():
        if len(sampler_results) < 5:  # Need enough data for analysis
            continue
            
        parameter_impact[sampler_type] = {}
        
        # Get all parameter names for this sampler
        all_params = set()
        for result in sampler_results:
            all_params.update(result['parameters'].keys())
        
        # Analyze each parameter
        for param_name in all_params:
            param_values = {}
            
            # Group results by parameter value
            for result in sampler_results:
                param_value = result['parameters'].get(param_name)
                if param_value is not None:
                    if param_value not in param_values:
                        param_values[param_value] = []
                    param_values[param_value].append(result['mean_score'])
            
            # Calculate variance between parameter values
            if len(param_values) > 1:
                group_means = [statistics.mean(scores) for scores in param_values.values()]
                parameter_impact[sampler_type][param_name] = statistics.stdev(group_means)
            else:
                parameter_impact[sampler_type][param_name] = 0.0
    
    return parameter_impact

def find_optimal_ranges(results: List[Dict[str, Any]]) -> Dict[str, Dict[str, Tuple[float, float]]]:
    """Find optimal parameter ranges for each sampler type."""
    optimal_ranges = {}
    
    # Group by sampler type
    by_sampler = {}
    for result in results:
        sampler_type = result['sampler_type']
        if sampler_type not in by_sampler:
            by_sampler[sampler_type] = []
        by_sampler[sampler_type].append(result)
    
    for sampler_type, sampler_results in by_sampler.items():
        if len(sampler_results) < 5:
            continue
        
        # Get top 25% performing configurations
        sorted_results = sorted(sampler_results, key=lambda x: x['mean_score'], reverse=True)
        top_25_percent = sorted_results[:max(1, len(sorted_results) // 4)]
        
        optimal_ranges[sampler_type] = {}
        
        # Get all parameter names
        all_params = set()
        for result in top_25_percent:
            all_params.update(result['parameters'].keys())
        
        # Find ranges for each parameter
        for param_name in all_params:
            values = []
            for result in top_25_percent:
                param_value = result['parameters'].get(param_name)
                if param_value is not None and isinstance(param_value, (int, float)):
                    values.append(param_value)
            
            if values:
                optimal_ranges[sampler_type][param_name] = (min(values), max(values))
    
    return optimal_ranges

def generate_recommendations(results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate optimization recommendations based on search results."""
    sampler_analysis = analyze_sampler_performance(results)
    parameter_importance = analyze_parameter_importance(results)
    optimal_ranges = find_optimal_ranges(results)
    
    recommendations = {
        'best_overall': max(results, key=lambda x: x['mean_score']),
        'best_by_sampler': {},
        'parameter_recommendations': {},
        'further_exploration': []
    }
    
    # Best configuration for each sampler type
    for sampler_type, stats in sampler_analysis.items():
        recommendations['best_by_sampler'][sampler_type] = stats['best_config']
    
    # Parameter recommendations
    for sampler_type, param_impacts in parameter_importance.items():
        if sampler_type in optimal_ranges:
            recommendations['parameter_recommendations'][sampler_type] = {
                'most_important_params': sorted(param_impacts.items(), 
                                              key=lambda x: x[1], reverse=True)[:3],
                'optimal_ranges': optimal_ranges[sampler_type]
            }
    
    # Suggestions for further exploration
    if parameter_importance:
        max_impact_sampler = max(parameter_importance.items(), 
                               key=lambda x: max(x[1].values()) if x[1] else 0)
        recommendations['further_exploration'].append(
            f"Focus on {max_impact_sampler[0]} sampler - shows highest parameter sensitivity"
        )
    
    return recommendations

def print_analysis_report(data: Dict[str, Any]):
    """Print a comprehensive analysis report."""
    results = data['all_results']
    metadata = data['search_metadata']
    
    print("🔍 HYPERPARAMETER SEARCH ANALYSIS REPORT")
    print("=" * 50)
    
    # Basic statistics
    print(f"\n📊 Search Overview:")
    print(f"   Total configurations tested: {metadata['total_configurations']}")
    print(f"   Best overall score: {metadata['best_score']:.3f}")
    print(f"   Search timestamp: {metadata['timestamp']}")
    
    # Sampler performance analysis
    print(f"\n🎯 Sampler Performance Analysis:")
    sampler_stats = analyze_sampler_performance(results)
    
    for sampler_type, stats in sorted(sampler_stats.items(), 
                                    key=lambda x: x[1]['mean'], reverse=True):
        print(f"\n   {sampler_type.upper()}:")
        print(f"     Mean score: {stats['mean']:.3f} ± {stats['std']:.3f}")
        print(f"     Range: {stats['min']:.3f} - {stats['max']:.3f}")
        print(f"     Configurations tested: {stats['count']}")
        print(f"     Best config: {stats['best_config']['parameters']}")
        print(f"     Best score: {stats['best_config']['mean_score']:.3f}")
    
    # Parameter importance
    print(f"\n🔧 Parameter Importance Analysis:")
    param_importance = analyze_parameter_importance(results)
    
    for sampler_type, params in param_importance.items():
        if params:
            print(f"\n   {sampler_type.upper()}:")
            sorted_params = sorted(params.items(), key=lambda x: x[1], reverse=True)
            for param_name, impact in sorted_params[:3]:
                print(f"     {param_name}: {impact:.3f} impact")
    
    # Optimal ranges
    print(f"\n🎯 Optimal Parameter Ranges:")
    optimal_ranges = find_optimal_ranges(results)
    
    for sampler_type, ranges in optimal_ranges.items():
        if ranges:
            print(f"\n   {sampler_type.upper()}:")
            for param_name, (min_val, max_val) in ranges.items():
                print(f"     {param_name}: {min_val:.3f} - {max_val:.3f}")
    
    # Recommendations
    print(f"\n💡 Recommendations:")
    recommendations = generate_recommendations(results)
    
    best = recommendations['best_overall']
    print(f"\n   🏆 Best Overall Configuration:")
    print(f"     Sampler: {best['sampler_type']}")
    print(f"     Score: {best['mean_score']:.3f} ± {best['std_score']:.3f}")
    print(f"     Parameters: {best['parameters']}")
    
    print(f"\n   🔄 Suggestions for Further Exploration:")
    for suggestion in recommendations['further_exploration']:
        print(f"     • {suggestion}")
    
    # Add more specific recommendations based on the data
    if sampler_stats:
        best_sampler = max(sampler_stats.items(), key=lambda x: x[1]['mean'])
        print(f"     • Consider focusing future searches on {best_sampler[0]} sampler")
        
        if best_sampler[1]['std'] > 0.5:
            print(f"     • {best_sampler[0]} shows high variance - explore parameter ranges more carefully")

def export_best_configs(data: Dict[str, Any], output_file: str):
    """Export best configurations to a YAML file for easy use."""
    results = data['all_results']
    sampler_stats = analyze_sampler_performance(results)
    
    export_data = {
        'best_overall': data['best_configuration'],
        'best_by_sampler': {},
        'search_metadata': data['search_metadata']
    }
    
    for sampler_type, stats in sampler_stats.items():
        export_data['best_by_sampler'][sampler_type] = {
            'description': f'Best {sampler_type} from hyper-search',
            'sampler': sampler_type,
            'parameters': stats['best_config']['parameters'],
            'performance': {
                'mean_score': stats['best_config']['mean_score'],
                'std_score': stats['best_config']['std_score']
            }
        }
    
    try:
        import yaml
        with open(output_file, 'w') as f:
            yaml.dump(export_data, f, default_flow_style=False, indent=2)
        print(f"\n📁 Best configurations exported to: {output_file}")
    except ImportError:
        # Fallback to JSON if yaml not available
        json_file = output_file.replace('.yaml', '.json').replace('.yml', '.json')
        with open(json_file, 'w') as f:
            json.dump(export_data, f, indent=2)
        print(f"\n📁 Best configurations exported to: {json_file}")

def main():
    """Main function with command line interface."""
    parser = argparse.ArgumentParser(
        description="Analyze hyperparameter search results",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Analyze specific results file
  python scripts/analyze_hyper_search.py results/hyper_search_bayesian_20240101_120000.json

  # Analyze latest results and export best configs
  python scripts/analyze_hyper_search.py --latest --export best_configs.yaml

  # Compare multiple search results
  python scripts/analyze_hyper_search.py results/hyper_search_*.json
        """
    )
    
    parser.add_argument("files", nargs="*", 
                       help="Search result files to analyze")
    
    parser.add_argument("--latest", "-l", action="store_true",
                       help="Analyze the most recent search results")
    
    parser.add_argument("--export", "-e",
                       help="Export best configurations to file")
    
    parser.add_argument("--compare", "-c", action="store_true",
                       help="Compare multiple search results")
    
    args = parser.parse_args()
    
    # Find files to analyze
    if args.latest:
        # Find most recent search results
        pattern = "results/hyper_search_*.json"
        files = glob.glob(pattern)
        if not files:
            print(f"❌ No search result files found matching: {pattern}")
            sys.exit(1)
        files = [max(files, key=lambda f: Path(f).stat().st_mtime)]
    elif args.files:
        files = []
        for pattern in args.files:
            if '*' in pattern:
                files.extend(glob.glob(pattern))
            else:
                files.append(pattern)
    else:
        print("❌ No input files specified. Use --latest or provide file paths.")
        sys.exit(1)
    
    if not files:
        print("❌ No valid result files found")
        sys.exit(1)
    
    # Analyze files
    if len(files) == 1 or not args.compare:
        # Single file analysis
        data = load_search_results(files[0])
        print(f"📊 Analyzing: {files[0]}")
        print_analysis_report(data)
        
        if args.export:
            export_best_configs(data, args.export)
    
    else:
        # Multiple file comparison
        print(f"🔍 Comparing {len(files)} search results:")
        all_results = []
        
        for filepath in files:
            data = load_search_results(filepath)
            all_results.extend(data['all_results'])
            print(f"   📄 {filepath}: {len(data['all_results'])} configurations")
        
        # Create combined analysis
        combined_data = {
            'search_metadata': {
                'total_configurations': len(all_results),
                'best_score': max(r['mean_score'] for r in all_results),
                'timestamp': 'Combined analysis'
            },
            'all_results': all_results,
            'best_configuration': max(all_results, key=lambda x: x['mean_score'])
        }
        
        print_analysis_report(combined_data)
        
        if args.export:
            export_best_configs(combined_data, args.export)

if __name__ == "__main__":
    main() 