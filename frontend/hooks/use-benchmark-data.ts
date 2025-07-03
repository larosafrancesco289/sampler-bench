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
    const samplerCounts = new Map<string, number>()

    rawData.forEach(entry => {
      // Count models
      const model = entry.model_name || 'Unknown Model'
      modelCounts.set(model, (modelCounts.get(model) || 0) + 1)
      
      // Count samplers
      samplerCounts.set(entry.sampler_name, (samplerCounts.get(entry.sampler_name) || 0) + 1)
    })

    const modelOptions: FilterOption[] = Array.from(modelCounts.entries())
      .map(([model, count]) => ({
        value: model,
        label: model,
        count
      }))
      .sort((a, b) => a.label.localeCompare(b.label))

    const samplerOptions: FilterOption[] = Array.from(samplerCounts.entries())
      .map(([sampler, count]) => ({
        value: sampler,
        label: sampler,
        count
      }))
      .sort((a, b) => a.label.localeCompare(b.label))

    return { modelOptions, samplerOptions }
  }, [rawData])

  // Filter data based on selected filters
  const filteredData = useMemo(() => {
    if (selectedModels.length === 0 && selectedSamplers.length === 0) {
      return rawData
    }

    return rawData.filter(entry => {
      const modelMatch = selectedModels.length === 0 || 
        selectedModels.includes(entry.model_name || 'Unknown Model')
      const samplerMatch = selectedSamplers.length === 0 || 
        selectedSamplers.includes(entry.sampler_name)
      
      return modelMatch && samplerMatch
    })
  }, [rawData, selectedModels, selectedSamplers])

  // Update summary based on filtered data
  const filteredSummary = useMemo(() => {
    if (!summary) return null

    return {
      ...summary,
      total_samples: filteredData.reduce((sum, entry) => sum + entry.total_samples, 0),
      unique_samplers: new Set(filteredData.map(entry => entry.sampler_name)).size,
      avg_quality_score: filteredData.length > 0 
        ? filteredData.reduce((sum, entry) => sum + entry.average_score, 0) / filteredData.length 
        : 0,
      models_tested: new Set(filteredData.map(entry => entry.model_name || 'Unknown Model')).size
    }
  }, [summary, filteredData])

  const resetFilters = useCallback(() => {
    setSelectedModels([])
    setSelectedSamplers([])
  }, [])

  return { 
    data: filteredData, 
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
    hasActiveFilters: selectedModels.length > 0 || selectedSamplers.length > 0
  }
} 