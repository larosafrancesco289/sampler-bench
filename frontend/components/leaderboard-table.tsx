"use client"

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useBenchmarkContext } from "@/contexts/benchmark-context"
import { Medal, ChevronDown, ChevronUp, Users, Gauge } from "lucide-react"

export function LeaderboardTable() {
  const {
    data,
    loading,
    error,
    refetch,
    hasActiveFilters
  } = useBenchmarkContext()

  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

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

  const getRankStyle = (index: number) => {
    if (index === 0) return 'bg-gradient-to-br from-[var(--color-accent)] to-[#D4AF37] text-black shadow-lg'
    if (index === 1) return 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800'
    if (index === 2) return 'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
    return 'bg-muted text-fg-muted'
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="text-center text-fg-muted text-sm py-4">Loading benchmark results...</div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-muted rounded-xl" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <div className="text-red-600 dark:text-red-400 font-medium mb-2">Error loading results</div>
        <div className="text-fg-muted text-sm mb-4">{error}</div>
        <button
          onClick={refetch}
          className="px-5 py-2.5 bg-[var(--color-accent)] text-black rounded-lg font-medium hover:brightness-110 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)] focus:ring-offset-2"
        >
          Retry
        </button>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="text-fg-muted">
          {hasActiveFilters ? 'No results match the current filters' : 'No benchmark data available'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Model Filter Pills */}
      {availableModels.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg mb-4">
          <span className="text-xs font-medium text-fg-muted uppercase tracking-wide">
            Filter by Model:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {availableModels.map(model => (
              <button
                key={model}
                onClick={() => handleModelToggle(model)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  selectedModels.includes(model)
                    ? 'bg-[var(--color-accent)] text-black'
                    : 'bg-surface text-fg-muted hover:text-fg border border-border'
                }`}
              >
                {model}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard Entries */}
      {filteredData.map((entry, index) => {
        const isExpanded = expandedIndex === index

        return (
          <div
            key={`${entry.sampler_name}-${entry.model_name || 'unknown'}-${index}`}
            className="group border border-border rounded-xl overflow-hidden bg-surface hover:border-[var(--color-accent)]/30 transition-all duration-300"
          >
            {/* Main Row - Always Visible */}
            <div
              className="flex items-center gap-4 p-4 cursor-pointer"
              onClick={() => setExpandedIndex(isExpanded ? null : index)}
            >
              {/* Rank Badge */}
              <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center font-display font-bold text-sm ${getRankStyle(index)}`}>
                {index < 3 ? <Medal className="w-4 h-4" /> : index + 1}
              </div>

              {/* Main Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-semibold text-fg truncate">{entry.sampler_name}</h3>
                  {entry.model_name && (
                    <span className="text-xs text-fg-muted bg-muted px-2 py-0.5 rounded">
                      {entry.model_name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-fg-muted truncate">{entry.description}</p>
              </div>

              {/* Score */}
              <div className="flex-shrink-0 text-right">
                <div className="text-2xl font-display font-semibold text-fg">
                  {entry.average_score.toFixed(2)}
                </div>
                <div className="text-xs text-fg-muted">
                  {entry.total_samples} samples
                </div>
              </div>

              {/* Expand Icon */}
              <div className="flex-shrink-0 text-fg-muted">
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="px-4 pb-4 pt-2 border-t border-border bg-muted/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Quality Criteria */}
                  <div>
                    <h4 className="text-sm font-medium text-fg mb-3 flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-[var(--color-accent)]" />
                      Quality Criteria
                    </h4>
                    <div className="space-y-2.5">
                      {Object.entries(entry.criteria_breakdown).map(([criterion, score]) => {
                        const std = entry.criteria_std?.[criterion]
                        return (
                          <div key={criterion} className="flex items-center justify-between gap-3">
                            <span className="text-sm text-fg-muted capitalize flex-shrink-0">
                              {criterion.replace(/_/g, ' ')}
                            </span>
                            <div className="flex items-center gap-2 flex-1 justify-end">
                              <Progress value={score * 10} className="w-24 h-1.5" />
                              <span className="text-sm font-medium text-fg w-12 text-right">
                                {score.toFixed(1)}
                                {std && <span className="text-[10px] text-fg-muted ml-0.5">±{std.toFixed(1)}</span>}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="space-y-4">
                    {/* Word Count */}
                    <div className="p-3 bg-surface rounded-lg border border-border-subtle">
                      <div className="text-xs text-fg-muted uppercase tracking-wide mb-1">Avg Word Count</div>
                      <div className="text-xl font-display font-semibold text-fg">{entry.avg_word_count}</div>
                    </div>

                    {/* Consensus & Judges */}
                    {(entry.avg_consensus_strength || entry.judge_count) && (
                      <div className="p-3 bg-surface rounded-lg border border-border-subtle">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4 text-[var(--color-accent-2)]" />
                          <span className="text-xs text-fg-muted uppercase tracking-wide">Evaluation</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {entry.judge_count && (
                            <Badge variant="outline" className="text-xs">
                              {entry.judge_count} judges
                            </Badge>
                          )}
                          {entry.avg_consensus_strength && (
                            <Badge
                              variant={entry.avg_consensus_strength > 0.8 ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {(entry.avg_consensus_strength * 100).toFixed(0)}% consensus
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Parameters */}
                    {Object.keys(entry.parameters || {}).length > 0 && (
                      <div>
                        <div className="text-xs text-fg-muted uppercase tracking-wide mb-2">Parameters</div>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(entry.parameters).map(([key, value]) => (
                            <span key={key} className="text-xs px-2 py-1 bg-muted rounded text-fg-muted">
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
} 