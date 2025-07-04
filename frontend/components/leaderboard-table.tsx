"use client"

import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useBenchmarkContext } from "@/contexts/benchmark-context"
import { QualityFilters } from "@/components/quality-filters"

export function LeaderboardTable() {
  const { 
    data, 
    loading, 
    error, 
    refetch, 
    hasActiveFilters,
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
  } = useBenchmarkContext()

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center text-gray-600 dark:text-gray-300">Loading benchmark results...</div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 dark:text-red-400 font-medium">Error loading results</div>
        <div className="text-gray-600 dark:text-gray-300 mt-2">{error}</div>
        <button 
          onClick={refetch} 
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded transition-all duration-300 transform hover:scale-105"
        >
          Retry
        </button>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
          {hasActiveFilters ? 'No results match the current filters' : 'No benchmark data available'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <QualityFilters
        onCriteriaFilterChange={handleCriteriaFilterChange}
        onWordCountFilterChange={setWordCountRange}
        onScoreRangeFilterChange={setScoreRange}
        onQuickPresetChange={handleQuickPresetChange}
        onReset={resetQualityFilters}
        criteriaFilters={criteriaFilters}
        wordCountRange={wordCountRange}
        scoreRange={scoreRange}
        activePreset={activePreset}
        dataBounds={dataBounds}
      />
      {data.map((entry, index) => (
        <div
          key={`${entry.sampler_name}-${entry.model_name || 'unknown'}-${index}`}
          className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md dark:hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-white dark:bg-gray-800/50"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold text-sm transition-colors duration-300">
                {index + 1}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-300">{entry.sampler_name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">{entry.description}</p>
                {entry.model_name && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium transition-colors duration-300">
                    Model: {entry.model_name}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 transition-colors duration-300">
                {entry.average_score.toFixed(2)}
                {entry.overall_std && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                    ±{entry.overall_std.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-end gap-2">
                <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
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
              <h4 className="font-medium mb-3 text-gray-700 dark:text-gray-300 transition-colors duration-300">Quality Criteria</h4>
              <div className="space-y-2">
                {Object.entries(entry.criteria_breakdown).map(([criterion, score]) => {
                  const std = entry.criteria_std?.[criterion];
                  return (
                    <div key={criterion} className="flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded transition-all duration-200">
                      <span className="text-sm capitalize text-gray-700 dark:text-gray-300 transition-colors duration-300">
                        {criterion.replace(/_/g, ' ')}
                      </span>
                      <div className="flex items-center space-x-2">
                        <Progress value={score * 10} className="w-16 h-2 transition-all duration-300" />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors duration-300">
                          {score.toFixed(1)}
                          {std && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
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
                <h4 className="font-medium mb-3 text-gray-700 dark:text-gray-300 transition-colors duration-300">Output Quality</h4>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <div className="text-lg font-medium text-gray-900 dark:text-gray-100 transition-colors duration-300">{entry.avg_word_count}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">avg words per sample</div>
                </div>
              </div>

              {/* Consistency Metrics */}
              {(entry.judge_count || entry.overall_std || entry.judge_models) && (
                <div>
                  <h4 className="font-medium mb-3 text-gray-700 dark:text-gray-300 transition-colors duration-300">
                    Evaluation Consistency
                  </h4>
                  <div className="space-y-2">
                    {entry.judge_count && (
                      <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Judges</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {entry.judge_count}
                        </span>
                      </div>
                    )}
                    {entry.overall_std && (
                      <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Score Variance</span>
                        <Badge 
                          variant={entry.overall_std < 0.5 ? "default" : entry.overall_std < 1.0 ? "secondary" : "outline"}
                          className="text-xs"
                        >
                          {entry.overall_std < 0.5 ? "Low" : entry.overall_std < 1.0 ? "Medium" : "High"} (±{entry.overall_std.toFixed(2)})
                        </Badge>
                      </div>
                    )}
                    {entry.judge_models && entry.judge_models.length > 0 && (
                      <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                        <div className="text-sm text-gray-700 dark:text-gray-300 mb-1">Judge Models</div>
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
                <h4 className="font-medium mb-3 text-gray-700 dark:text-gray-300 transition-colors duration-300">Sampling Parameters</h4>
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