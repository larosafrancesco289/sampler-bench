"use client"

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useBenchmarkContext } from "@/contexts/benchmark-context"

export function LeaderboardTable() {
  const { 
    data, 
    loading, 
    error, 
    refetch, 
    hasActiveFilters
  } = useBenchmarkContext()

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
    return data.filter(entry => {
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
        <div className="text-center text-fg-muted">Loading benchmark results...</div>
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
        <div className="text-red-600 dark:text-red-400 font-medium">Error loading results</div>
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
          {hasActiveFilters ? 'No results match the current filters' : 'No benchmark data available'}
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

      {filteredData.map((entry, index) => (
        <div
          key={`${entry.sampler_name}-${entry.model_name || 'unknown'}-${index}`}
          className="border border-border rounded-2xl p-6 hover:shadow-md transition-all duration-300 hover:scale-[1.02] bg-surface"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent text-black font-bold text-sm transition-colors duration-300">
                {index + 1}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-fg transition-colors duration-300">{entry.sampler_name}</h3>
                <p className="text-sm text-fg-muted transition-colors duration-300">{entry.description}</p>
                {entry.model_name && (
                  <p className="text-xs text-fg-muted font-medium transition-colors duration-300">
                    Model: {entry.model_name}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-fg transition-colors duration-300">
                {entry.average_score.toFixed(2)}
                {entry.overall_std && (
                  <span className="text-xs text-fg-muted ml-1">
                    ±{entry.overall_std.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-end gap-2">
                <div className="text-sm text-fg-muted transition-colors duration-300">
                  {entry.total_samples} samples
                </div>
                {entry.avg_consensus_strength && (
                  <Badge 
                    variant={entry.avg_consensus_strength > 0.8 ? "default" : entry.avg_consensus_strength > 0.6 ? "secondary" : "outline"}
                    className="text-xs"
                    title={`Average consensus strength: ${(entry.avg_consensus_strength * 100).toFixed(0)}%`}
                  >
                    {entry.avg_consensus_strength > 0.8 ? "High" : entry.avg_consensus_strength > 0.6 ? "Medium" : "Low"} Agreement
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quality Criteria Breakdown */}
            <div>
              <h4 className="font-medium mb-3 text-fg transition-colors duration-300">Quality Criteria</h4>
              <div className="space-y-2">
                {Object.entries(entry.criteria_breakdown).map(([criterion, score]) => {
                  const std = entry.criteria_std?.[criterion];
                  return (
                    <div key={criterion} className="flex items-center justify-between group hover:bg-muted p-2 rounded-2xl transition-all duration-200">
                      <span className="text-sm capitalize text-fg transition-colors duration-300" title={`${criterion.replace(/_/g, ' ')}: ${score.toFixed(2)}${std ? ` (±${std.toFixed(1)})` : ''}`}>
                        {criterion.replace(/_/g, ' ')}
                      </span>
                      <div className="flex items-center space-x-2">
                        <Progress value={score * 10} className="w-24 h-2 transition-all duration-300" />
                        <span className="text-sm font-medium text-fg transition-colors duration-300">
                          {score.toFixed(1)}
                          {std && (
                            <span className="text-xs text-fg-muted ml-1">
                              ±{std.toFixed(1)}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Parameters & Word Count */}
            <div className="space-y-4">
              <div>
              <h4 className="font-medium mb-3 text-fg transition-colors duration-300">Output Quality</h4>
                <div className="text-center p-3 bg-muted rounded-2xl transition-all duration-300 hover:brightness-105">
                  <div className="text-lg font-medium text-fg transition-colors duration-300">{entry.avg_word_count}</div>
                  <div className="text-sm text-fg-muted transition-colors duration-300">avg words per sample</div>
                </div>
              </div>

              {/* Consistency Metrics */}
              {(entry.judge_count || entry.overall_std || entry.judge_models) && (
                <div>
              <h4 className="font-medium mb-3 text-fg transition-colors duration-300">
                    Evaluation Consistency
                  </h4>
                  <div className="space-y-2">
                    {entry.judge_count && (
                      <div className="flex justify-between items-center p-2 bg-muted rounded-2xl">
                        <span className="text-sm text-fg">Judges</span>
                        <span className="text-sm font-medium text-fg">
                          {entry.judge_count}
                        </span>
                      </div>
                    )}
                    {entry.overall_std && (
                      <div className="flex justify-between items-center p-2 bg-muted rounded-2xl">
                        <span className="text-sm text-fg">Score Variance</span>
                        <Badge 
                          variant={entry.overall_std < 0.5 ? "default" : entry.overall_std < 1.0 ? "secondary" : "outline"}
                          className="text-xs"
                        >
                          {entry.overall_std < 0.5 ? "Low" : entry.overall_std < 1.0 ? "Medium" : "High"} (±{entry.overall_std.toFixed(2)})
                        </Badge>
                      </div>
                    )}
                    {entry.judge_models && entry.judge_models.length > 0 && (
                      <div className="p-2 bg-muted rounded-2xl">
                        <div className="text-sm text-fg mb-1">Judge Models</div>
                        <div className="flex flex-wrap gap-1">
                          {entry.judge_models.map((model, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {model.split('/').pop() || model}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-3 text-fg transition-colors duration-300">Sampling Parameters</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(entry.parameters).map(([key, value]) => (
                    <Badge key={key} variant="secondary" className="text-xs transition-all duration-300 hover:scale-105">
                      {key}: {value}
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