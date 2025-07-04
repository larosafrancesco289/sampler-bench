import { useState, useEffect, useMemo, useCallback } from 'react'
import type { ApiResponse, LeaderboardEntry } from '@/types/benchmark'

interface FilterOption {
  value: string
  label: string
  count: number
}

export function useBenchmarkData() {
  const [rawData, setRawData] = useState<LeaderboardEntry[]>([])
  const [summary, setSummary] = useState<ApiResponse['summary'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter states
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [selectedSamplers, setSelectedSamplers] = useState<string[]>([])
  const [aggregateAcrossModels, setAggregateAcrossModels] = useState<boolean>(false)
  
  // Quality filter states
  const [criteriaFilters, setCriteriaFilters] = useState<Record<string, number>>({})
  const [wordCountRange, setWordCountRange] = useState<[number, number]>([0, 1000])
  const [scoreRange, setScoreRange] = useState<[number, number]>([1, 10])
  const [activePreset, setActivePreset] = useState<string | null>(null)
  
  // Calculate actual data bounds for better defaults
  const dataBounds = useMemo(() => {
    if (rawData.length === 0) return { maxWordCount: 1000, minWordCount: 0, minScore: 1, maxScore: 10 }
    
    const wordCounts = rawData.map(entry => entry.avg_word_count).filter(Boolean)
    const scores = rawData.map(entry => entry.average_score).filter(Boolean)
    
    const maxWordCount = wordCounts.length > 0 ? Math.max(...wordCounts) : 1000
    const minWordCount = wordCounts.length > 0 ? Math.min(...wordCounts) : 0
    const minScore = scores.length > 0 ? Math.min(...scores) : 1
    const maxScore = scores.length > 0 ? Math.max(...scores) : 10
    
    return {
      maxWordCount: maxWordCount,
      minWordCount: Math.max(0, minWordCount), // Ensure minimum is at least 0
      minScore: minScore,
      maxScore: maxScore
    }
  }, [rawData])
  
  // Reset word count range when data changes to use actual bounds
  useEffect(() => {
    setWordCountRange([dataBounds.minWordCount, dataBounds.maxWordCount])
    setScoreRange([dataBounds.minScore, dataBounds.maxScore])
  }, [dataBounds])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/results')
      if (!response.ok) {
        throw new Error(`Failed to fetch results: ${response.statusText}`)
      }
      
      const apiResponse: ApiResponse = await response.json()
      setRawData(apiResponse.leaderboard)
      setSummary(apiResponse.summary)
    } catch (err) {
      console.error('Error fetching benchmark results:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Generate filter options from raw data
  const filterOptions = useMemo(() => {
    const modelCounts = new Map<string, number>()
    const samplerModelCombos = new Map<string, Set<string>>()


    rawData.forEach(entry => {
      // Count models
      const model = entry.model_name || 'Unknown Model'
      modelCounts.set(model, (modelCounts.get(model) || 0) + 1)
      
      // Parse actual sampler name from combined string
      // Format: "sampler_name (model_name)" or just "sampler_name"
      let actualSamplerName = entry.sampler_name
      const match = entry.sampler_name.match(/^([^(]+)(?:\s*\([^)]+\))?/)
      if (match) {
        actualSamplerName = match[1].trim()
      }
      
      // Track which models each sampler works with
      if (!samplerModelCombos.has(actualSamplerName)) {
        samplerModelCombos.set(actualSamplerName, new Set())
      }
      samplerModelCombos.get(actualSamplerName)!.add(model)
    })

    const modelOptions: FilterOption[] = Array.from(modelCounts.entries())
      .map(([model, count]) => ({
        value: model,
        label: model,
        count
      }))
      .sort((a, b) => a.label.localeCompare(b.label))

    // For samplers, group intelligently:
    // - model_default samplers should be separated by model (since they're model-specific)
    // - Other samplers should be grouped together (since they're the same across models)
    const samplerOptions: FilterOption[] = []
    
    samplerModelCombos.forEach((models, sampler) => {
      if (sampler === 'model_default') {
        // Create separate entries for each model's default
        models.forEach(model => {
          samplerOptions.push({
            value: `${sampler}_${model}`, // Unique value for filtering
            label: `${sampler} (${model})`,
            count: 1
          })
        })
      } else {
        // Group other samplers together
        samplerOptions.push({
          value: sampler,
          label: sampler,
          count: models.size // Number of models this sampler works with
        })
      }
    })

    // Custom sorting for better logical grouping
    const sortedSamplerOptions = samplerOptions.sort((a, b) => {
      // Define order priorities
      const getOrderPriority = (label: string) => {
        if (label.includes('model_default')) return 1  // Model defaults first
        if (label.includes('standard_')) return 2      // Standard strategies second
        if (label.includes('creative_')) return 3      // Creative strategies third
        return 4                                       // Everything else last
      }
      
      const priorityA = getOrderPriority(a.label)
      const priorityB = getOrderPriority(b.label)
      
      // First sort by priority
      if (priorityA !== priorityB) {
        return priorityA - priorityB
      }
      
      // Within same priority, sort alphabetically
      return a.label.localeCompare(b.label)
    })

    return { 
      modelOptions, 
      samplerOptions: sortedSamplerOptions
    }
  }, [rawData])

  // Filter data based on selected filters
  const filteredData = useMemo(() => {
    let data = rawData

    // Apply basic model/sampler filters
    if (selectedModels.length > 0 || selectedSamplers.length > 0) {
      data = data.filter(entry => {
        const model = entry.model_name || 'Unknown Model'
        
        // Parse actual sampler name from combined string
        let actualSamplerName = entry.sampler_name
        const match = entry.sampler_name.match(/^([^(]+)(?:\s*\([^)]+\))?/)
        if (match) {
          actualSamplerName = match[1].trim()
        }
        
        const modelMatch = selectedModels.length === 0 || selectedModels.includes(model)
        
        // Handle sampler filtering with new grouping logic
        let samplerMatch = selectedSamplers.length === 0
        if (!samplerMatch) {
          for (const selectedSampler of selectedSamplers) {
            if (selectedSampler.startsWith('model_default_')) {
              // Handle model_default filtering (model-specific)
              const expectedModel = selectedSampler.replace('model_default_', '')
              if (actualSamplerName === 'model_default' && model === expectedModel) {
                samplerMatch = true
                break
              }
            } else {
              // Handle regular sampler filtering (grouped across models)
              if (actualSamplerName === selectedSampler) {
                samplerMatch = true
                break
              }
            }
          }
        }
        
        return modelMatch && samplerMatch
      })
    }

    // Apply quality filters
    data = data.filter(entry => {
      // Score range filter
      if (entry.average_score < scoreRange[0] || entry.average_score > scoreRange[1]) {
        return false
      }

      // Word count range filter - ensure we have valid word count data
      if (entry.avg_word_count != null) {
        if (entry.avg_word_count < wordCountRange[0] || entry.avg_word_count > wordCountRange[1]) {
          return false
        }
      }

      // Criteria filters
      for (const [criterion, minScore] of Object.entries(criteriaFilters)) {
        const criterionScore = entry.criteria_breakdown[criterion]
        if (criterionScore === undefined || criterionScore < minScore) {
          return false
        }
      }

      return true
    })

    // Apply quick presets
    if (activePreset) {
      switch (activePreset) {
        case 'most_creative':
          data = data.filter(entry => {
            const creativityScore = entry.criteria_breakdown.creativity_execution || 
                                  entry.criteria_breakdown.creativity_originality || 0
            return creativityScore >= 6.0
          })
          break
        case 'best_structure':
          data = data.filter(entry => {
            const structureScore = entry.criteria_breakdown.narrative_structure || 
                                 entry.criteria_breakdown.narrative_coherence || 0
            return structureScore >= 6.0
          })
          break
        case 'concise_quality':
          data = data.filter(entry => entry.avg_word_count <= 400 && entry.average_score >= 5.0)
          break
        case 'consistent_performers':
          data = data.filter(entry => {
            // Filter by low standard deviation if available
            const hasLowVariation = entry.overall_std ? entry.overall_std < 1.5 : true
            return hasLowVariation && entry.average_score >= 4.0
          })
          break
        case 'engaging_writing':
          data = data.filter(entry => {
            const engagementScore = entry.criteria_breakdown.engagement || 
                                  entry.criteria_breakdown.engagement_readability || 0
            return engagementScore >= 6.0
          })
          break
      }
    }

    return data
  }, [rawData, selectedModels, selectedSamplers, criteriaFilters, wordCountRange, scoreRange, activePreset, dataBounds])

  // Aggregate data across models when toggle is enabled
  const processedData = useMemo(() => {
    if (!aggregateAcrossModels) {
      return filteredData
    }

    // Group by actual sampler name and aggregate scores
    const samplerGroups = new Map<string, {
      entries: typeof filteredData,
      totalSamples: number,
      totalScore: number,
      criteriaBreakdowns: Record<string, number[]>
    }>()

    filteredData.forEach(entry => {
      // Parse actual sampler name
      let actualSamplerName = entry.sampler_name
      const match = entry.sampler_name.match(/^([^(]+)(?:\s*\([^)]+\))?/)
      if (match) {
        actualSamplerName = match[1].trim()
      }

      if (!samplerGroups.has(actualSamplerName)) {
        samplerGroups.set(actualSamplerName, {
          entries: [],
          totalSamples: 0,
          totalScore: 0,
          criteriaBreakdowns: {}
        })
      }

      const group = samplerGroups.get(actualSamplerName)!
      group.entries.push(entry)
      group.totalSamples += entry.total_samples
      group.totalScore += entry.average_score * entry.total_samples

      // Aggregate criteria breakdowns
      Object.entries(entry.criteria_breakdown).forEach(([criterion, score]) => {
        if (!group.criteriaBreakdowns[criterion]) {
          group.criteriaBreakdowns[criterion] = []
        }
        group.criteriaBreakdowns[criterion].push(score)
      })
    })

    // Convert back to LeaderboardEntry format
    return Array.from(samplerGroups.entries()).map(([samplerName, group]) => {
      const avgScore = group.totalScore / group.totalSamples
      const avgCriteriaBreakdown: Record<string, number> = {}
      
      Object.entries(group.criteriaBreakdowns).forEach(([criterion, scores]) => {
        avgCriteriaBreakdown[criterion] = scores.reduce((sum, score) => sum + score, 0) / scores.length
      })

      const avgWordCount = Math.round(
        group.entries.reduce((sum, entry) => sum + entry.avg_word_count * entry.total_samples, 0) / group.totalSamples
      )

      // Use the first entry as template and override aggregated values
      const templateEntry = group.entries[0]
      return {
        ...templateEntry,
        sampler_name: samplerName,
        model_name: undefined, // Remove model specificity
        average_score: avgScore,
        total_samples: group.totalSamples,
        criteria_breakdown: avgCriteriaBreakdown,
        avg_word_count: avgWordCount,
        description: `${samplerName} (aggregated across ${group.entries.length} models)`
      }
    }).sort((a, b) => b.average_score - a.average_score) // Sort by score descending
  }, [filteredData, aggregateAcrossModels])

  // Update summary based on processed data
  const filteredSummary = useMemo(() => {
    if (!summary) return null

    return {
      ...summary,
      total_samples: processedData.reduce((sum, entry) => sum + entry.total_samples, 0),
      unique_samplers: new Set(processedData.map(entry => {
        // Parse actual sampler name using same logic as filter options
        let actualSamplerName = entry.sampler_name
        const match = entry.sampler_name.match(/^([^(]+)(?:\s*\([^)]+\))?/)
        if (match) {
          actualSamplerName = match[1].trim()
        }
        return actualSamplerName
      })).size,
      avg_quality_score: processedData.length > 0 
        ? processedData.reduce((sum, entry) => sum + entry.average_score * entry.total_samples, 0) / 
          processedData.reduce((sum, entry) => sum + entry.total_samples, 0)
        : 0,
      models_tested: aggregateAcrossModels 
        ? new Set(filteredData.map(entry => entry.model_name || 'Unknown Model')).size
        : new Set(processedData.map(entry => entry.model_name || 'Unknown Model')).size
    }
  }, [summary, processedData, filteredData, aggregateAcrossModels])

  const resetFilters = useCallback(() => {
    setSelectedModels([])
    setSelectedSamplers([])
  }, [])

  const resetQualityFilters = useCallback(() => {
    setCriteriaFilters({})
    setWordCountRange([dataBounds.minWordCount, dataBounds.maxWordCount])
    setScoreRange([dataBounds.minScore, dataBounds.maxScore])
    setActivePreset(null)
  }, [dataBounds])

  const handleCriteriaFilterChange = useCallback((criterion: string, minScore: number) => {
    setCriteriaFilters(prev => {
      if (minScore === 0) {
        const { [criterion]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [criterion]: minScore }
    })
  }, [])

  const handleQuickPresetChange = useCallback((preset: string) => {
    setActivePreset(preset === "" ? null : preset)
  }, [])

  return { 
    data: processedData, 
    summary: filteredSummary, 
    loading, 
    error, 
    refetch: fetchData,
    // Filter controls
    filterOptions,
    selectedModels,
    selectedSamplers,
    setSelectedModels,
    setSelectedSamplers,
    resetFilters,
    hasActiveFilters: selectedModels.length > 0 || selectedSamplers.length > 0 || 
                     Object.keys(criteriaFilters).length > 0 || 
                     wordCountRange[0] > dataBounds.minWordCount || wordCountRange[1] < dataBounds.maxWordCount ||
                     scoreRange[0] > dataBounds.minScore || scoreRange[1] < dataBounds.maxScore ||
                     activePreset !== null,
    // Aggregation controls
    aggregateAcrossModels,
    setAggregateAcrossModels,
    // Quality filter controls
    criteriaFilters,
    wordCountRange,
    scoreRange,
    activePreset,
    handleCriteriaFilterChange,
    setWordCountRange,
    setScoreRange,
    handleQuickPresetChange,
    resetQualityFilters,
    dataBounds
  }
} 