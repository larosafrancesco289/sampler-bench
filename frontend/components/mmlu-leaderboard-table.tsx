"use client"

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useMmluContext } from "@/contexts/mmlu-context"

export function MmluLeaderboardTable() {
  const { 
    data, 
    loading, 
    error, 
    refetch, 
    hasActiveFilters
  } = useMmluContext()

  // Get unique models for the toggle
  const availableModels = useMemo(() => {
    const models = [...new Set(data.map(entry => entry.model_name || 'Unknown Model'))]
    return models.sort()
  }, [data])

  const [selectedModels, setSelectedModels] = useState<string[]>(availableModels)

  // Update selected models when available models change
  useMemo(() => {
    if (availableModels.length > 0 && selectedModels.length === 0) {
      setSelectedModels(availableModels)
    }
  }, [availableModels, selectedModels.length])

  // Filter data based on selected models
  const filteredData = useMemo(() => {
    return data.filter((entry) => {
      const modelName = entry.model_name || 'Unknown Model'
      return selectedModels.includes(modelName)
    })
  }, [data, selectedModels])

  const handleModelToggle = (modelName: string) => {
    setSelectedModels(prev => 
      prev.includes(modelName) 
        ? prev.filter(m => m !== modelName)
        : [...prev, modelName]
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center text-fg-muted">Loading MMLU results...</div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-muted rounded transition-colors duration-300"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 dark:text-red-400 font-medium">Error loading MMLU results</div>
        <div className="text-fg-muted mt-2">{error}</div>
        <button 
          onClick={refetch} 
          className="mt-4 px-4 py-2 bg-accent text-black rounded-2xl hover:brightness-110 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]"
        >
          Retry
        </button>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-fg-muted transition-colors duration-300">
          {hasActiveFilters ? 'No results match the current filters' : 'No MMLU data available'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Simple Model Toggle */}
      {availableModels.length > 1 && (
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium text-fg">
            Models:
          </span>
          <div className="flex flex-wrap gap-2">
            {availableModels.map(model => (
              <Badge
                key={model}
                variant={selectedModels.includes(model) ? "default" : "outline"}
                className="cursor-pointer transition-all duration-200 hover:scale-105"
                onClick={() => handleModelToggle(model)}
              >
                {model}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {filteredData.map((entry, index: number) => (
        <div
          key={`${entry.sampler_name}-${entry.model_name || 'unknown'}-${index}`}
          className="border border-border rounded-2xl p-4 sm:p-6 hover:shadow-md transition-all duration-300 bg-surface"
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0 mb-4">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent text-black font-bold text-sm transition-colors duration-300">
                {index + 1}
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-fg transition-colors duration-300 break-words">{entry.sampler_name}</h3>
                {entry.model_name && (
                  <p className="text-xs text-fg-muted font-medium transition-colors duration-300">
                    Model: {entry.model_name}
                  </p>
                )}
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-xl sm:text-2xl font-bold text-fg transition-colors duration-300">
                {(entry.average_score * 100).toFixed(1)}%
              </div>
              <div className="flex items-center justify-start sm:justify-end gap-2 flex-wrap">
                <div className="text-sm text-fg-muted transition-colors duration-300">
                  {entry.total_samples} questions
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Accuracy breakdown shows only 'accuracy' if present */}
            <div>
              <h4 className="font-medium mb-2 sm:mb-3 text-fg transition-colors duration-300">Accuracy</h4>
              <div className="space-y-2">
                {Object.entries(entry.criteria_breakdown).map(([criterion, score]: [string, number]) => (
                  <div key={criterion} className="flex items-center justify-between gap-2 group hover:bg-muted p-2 rounded-2xl transition-all duration-200">
                    <span className="text-sm capitalize text-fg transition-colors duration-300 break-words">
                      {criterion.replace(/_/g, ' ')}
                    </span>
                    <div className="flex items-center gap-2">
                      <Progress value={Number(score) * 100} className="w-20 sm:w-24 h-2 transition-all duration-300" />
                      <span className="text-sm font-medium text-fg transition-colors duration-300 whitespace-nowrap">
                        {(Number(score) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Parameters */}
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 sm:mb-3 text-fg transition-colors duration-300">Sampling Parameters</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(entry.parameters).map(([key, value]: [string, unknown]) => (
                    <Badge key={key} variant="secondary" className="text-xs transition-all duration-300 hover:scale-105">
                      {key}: {String(value)}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}


