import type { BenchmarkResults, LeaderboardEntry, Sample } from '../types/benchmark'

export function processBenchmarkData(benchmarkData: BenchmarkResults): LeaderboardEntry[] {
  const samplerGroups = new Map<string, Sample[]>()
  
  // Group samples by sampler name
  benchmarkData.samples.forEach(sample => {
    if (!samplerGroups.has(sample.sampler_name)) {
      samplerGroups.set(sample.sampler_name, [])
    }
    samplerGroups.get(sample.sampler_name)!.push(sample)
  })
  
  // Process each sampler group into a leaderboard entry
  const entries: LeaderboardEntry[] = []
  
  for (const [samplerName, samples] of Array.from(samplerGroups)) {
    const totalSamples = samples.length
    
    if (totalSamples === 0) continue
    
    // Calculate average score
    const totalScore = samples.reduce((sum: number, sample: Sample) => sum + sample.judgment.overall_score, 0)
    const averageScore = totalScore / totalSamples
    
    // Calculate consistency metrics
    const overallStds = samples.map(sample => sample.judgment.overall_std).filter((std): std is number => typeof std === 'number')
    const overall_std = overallStds.length > 0 ? overallStds.reduce((sum, std) => sum + std, 0) / overallStds.length : undefined
    
    // Get judge information from first sample
    const firstJudgment = samples[0]?.judgment
    const judge_count = firstJudgment?.judge_count
    const judge_models = firstJudgment?.judge_models
    
    // Calculate criteria breakdown
    const criteriaBreakdown: Record<string, number> = {}
    const criteriaStd: Record<string, number> = {}
    
    // Get all unique criteria from all samples
    const allCriteria = new Set<string>()
    samples.forEach((sample: Sample) => {
      sample.judgment.criterion_scores.forEach((criterionScore) => {
        allCriteria.add(criterionScore.criterion)
      })
    })
    
    // Calculate average score and std for each criterion
    const consensusStrengths: number[] = []
    
    for (const criterion of Array.from(allCriteria)) {
      const criterionData = samples
        .map((sample: Sample) => {
          const criterionScore = sample.judgment.criterion_scores.find((c) => c.criterion === criterion)
          return criterionScore ? {
            score: criterionScore.score,
            std: criterionScore.std,
            consensus_strength: criterionScore.consensus_strength
          } : null
        })
        .filter(Boolean)
      
      if (criterionData.length > 0) {
        // Average score
        const scores = criterionData.map(d => d!.score)
        criteriaBreakdown[criterion] = scores.reduce((sum, score) => sum + score, 0) / scores.length
        
        // Average standard deviation
        const stds = criterionData.map(d => d!.std).filter((std): std is number => typeof std === 'number')
        if (stds.length > 0) {
          criteriaStd[criterion] = stds.reduce((sum, std) => sum + std, 0) / stds.length
        }
        
        // Collect consensus strengths
        const consensuses = criterionData.map(d => d!.consensus_strength).filter((cs): cs is number => typeof cs === 'number')
        consensusStrengths.push(...consensuses)
      }
    }
    
    // Calculate average consensus strength
    const avg_consensus_strength = consensusStrengths.length > 0 
      ? consensusStrengths.reduce((sum, cs) => sum + cs, 0) / consensusStrengths.length 
      : undefined
    
    // Calculate average word count
    const totalWordCount = samples.reduce((sum: number, sample: Sample) => sum + sample.word_count, 0)
    const avgWordCount = Math.round(totalWordCount / totalSamples)
    
    // Get sampler configuration
    const samplerConfig = benchmarkData.sampler_configs[samplerName]
    
    const entry: LeaderboardEntry = {
      sampler_name: samplerName,
      average_score: Number(averageScore.toFixed(2)),
      total_samples: totalSamples,
      criteria_breakdown: criteriaBreakdown,
      description: samplerConfig?.description || 'No description available',
      parameters: samplerConfig?.parameters || {},
      avg_word_count: avgWordCount,
      // Consistency metrics
      overall_std: overall_std ? Number(overall_std.toFixed(3)) : undefined,
      avg_consensus_strength: avg_consensus_strength ? Number(avg_consensus_strength.toFixed(3)) : undefined,
      criteria_std: Object.keys(criteriaStd).length > 0 ? 
        Object.fromEntries(Object.entries(criteriaStd).map(([k, v]) => [k, Number(v.toFixed(3))])) : undefined,
      judge_count: judge_count,
      judge_models: judge_models
    }
    
    entries.push(entry)
  }
  
  return entries
} 