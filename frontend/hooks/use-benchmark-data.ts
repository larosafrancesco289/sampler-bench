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
    if (selectedModels.length === 0 && selectedSamplers.length === 0) {
      return rawData
    }

    return rawData.filter(entry => {
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
  }, [rawData, selectedModels, selectedSamplers])

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
    hasActiveFilters: selectedModels.length > 0 || selectedSamplers.length > 0,
    // Aggregation controls
    aggregateAcrossModels,
    setAggregateAcrossModels
  }
} 