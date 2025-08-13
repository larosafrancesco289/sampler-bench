import { useState, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ApiResponse, LeaderboardEntry } from '@/types/benchmark'

interface FilterOption {
  value: string
  label: string
  count: number
}

async function fetchMmluData(): Promise<ApiResponse> {
  const response = await fetch('/api/mmlu')
  if (!response.ok) {
    throw new Error(`Failed to fetch MMLU results: ${response.statusText}`)
  }
  return response.json()
}

export function useMmluData() {
  const { data: apiResponse, isLoading, error, refetch: queryRefetch } = useQuery({
    queryKey: ['mmlu-data'],
    queryFn: fetchMmluData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  const rawData: LeaderboardEntry[] = useMemo(() => apiResponse?.leaderboard || [], [apiResponse])
  const summary = apiResponse?.summary || null
  const rawResults = apiResponse?.raw_data || []
  const loading = isLoading
  const errorMessage = error ? (error instanceof Error ? error.message : 'Failed to load MMLU data') : null

  const refetch = useCallback(() => {
    queryRefetch()
  }, [queryRefetch])

  // Filter states
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [selectedSamplers, setSelectedSamplers] = useState<string[]>([])

  // Generate filter options from raw data
  const filterOptions = useMemo(() => {
    const modelCounts = new Map<string, number>()
    const samplerModelCombos = new Map<string, Set<string>>()

    rawData.forEach(entry => {
      // Count models
      const model = entry.model_name || 'Unknown Model'
      modelCounts.set(model, (modelCounts.get(model) || 0) + 1)

      // Parse actual sampler name from combined string
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
      .map(([model, count]) => ({ value: model, label: model, count }))
      .sort((a, b) => a.label.localeCompare(b.label))

    const samplerOptions: FilterOption[] = []
    samplerModelCombos.forEach((models, sampler) => {
      if (sampler === 'model_default') {
        models.forEach(model => {
          samplerOptions.push({ value: `${sampler}_${model}`, label: `${sampler} (${model})`, count: 1 })
        })
      } else {
        samplerOptions.push({ value: sampler, label: sampler, count: models.size })
      }
    })

    const sortedSamplerOptions = samplerOptions.sort((a, b) => {
      const priority = (label: string) => {
        if (label.includes('model_default')) return 1
        if (label.includes('standard_')) return 2
        if (label.includes('creative_')) return 3
        return 4
      }
      const pa = priority(a.label)
      const pb = priority(b.label)
      if (pa !== pb) return pa - pb
      return a.label.localeCompare(b.label)
    })

    return { modelOptions, samplerOptions: sortedSamplerOptions }
  }, [rawData])

  // Filter data based on selected filters
  const filteredData = useMemo(() => {
    let data = rawData

    if (selectedModels.length > 0 || selectedSamplers.length > 0) {
      data = data.filter(entry => {
        const model = entry.model_name || 'Unknown Model'

        let actualSamplerName = entry.sampler_name
        const match = entry.sampler_name.match(/^([^(]+)(?:\s*\([^)]+\))?/)
        if (match) {
          actualSamplerName = match[1].trim()
        }

        const modelMatch = selectedModels.length === 0 || selectedModels.includes(model)

        let samplerMatch = selectedSamplers.length === 0
        if (!samplerMatch) {
          for (const selectedSampler of selectedSamplers) {
            if (selectedSampler.startsWith('model_default_')) {
              const expectedModel = selectedSampler.replace('model_default_', '')
              if (actualSamplerName === 'model_default' && model === expectedModel) {
                samplerMatch = true
                break
              }
            } else {
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

    return data
  }, [rawData, selectedModels, selectedSamplers])

  const resetFilters = useCallback(() => {
    setSelectedModels([])
    setSelectedSamplers([])
  }, [])

  return {
    data: filteredData,
    summary,
    loading,
    error: errorMessage,
    refetch,
    // Filter controls
    filterOptions,
    selectedModels,
    selectedSamplers,
    setSelectedModels,
    setSelectedSamplers,
    resetFilters,
    hasActiveFilters: selectedModels.length > 0 || selectedSamplers.length > 0,
    rawData: rawResults,
  }
}


