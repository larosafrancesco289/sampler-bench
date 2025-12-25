"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge, RankBadge } from "@/components/ui/badge"
import { GlassPanel } from "@/components/observatory/glass-panel"
import { FilterControls } from "@/components/filter-controls"
import { useBenchmarkContext } from "@/contexts/benchmark-context"
import { useMmluContext, MmluProvider } from "@/contexts/mmlu-context"
import { PenLine, Brain, ChevronDown, ChevronUp } from "lucide-react"

function LeaderboardContent() {
  const [activeTab, setActiveTab] = useState<'writing' | 'mmlu'>('writing')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const {
    data: writingData,
    filterOptions,
    selectedModels,
    selectedSamplers,
    setSelectedModels,
    setSelectedSamplers,
    resetFilters,
    aggregateAcrossModels,
    setAggregateAcrossModels,
    loading: writingLoading,
    error: writingError
  } = useBenchmarkContext()

  const mmlu = useMmluContext()

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const loading = activeTab === 'writing' ? writingLoading : mmlu.loading
  const error = activeTab === 'writing' ? writingError : mmlu.error
  const data = activeTab === 'writing' ? writingData : mmlu.data

  return (
    <div className="min-h-screen">
      <div className="container py-6 md:py-10">
        <Navigation />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl text-fg mb-3">Leaderboard</h1>
          <p className="text-fg-muted max-w-2xl">
            Compare sampling strategy performance across creative writing quality and MMLU-Pro accuracy benchmarks.
          </p>
        </motion.div>

        {/* Tab Switcher */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="inline-flex p-1 bg-surface/50 backdrop-blur-sm rounded-full border border-border-subtle">
            <button
              onClick={() => setActiveTab('writing')}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                activeTab === 'writing' ? 'text-black' : 'text-fg-muted hover:text-fg'
              }`}
            >
              {activeTab === 'writing' && (
                <motion.span
                  layoutId="tab-bg"
                  className="absolute inset-0 bg-accent rounded-full"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <PenLine className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Creative Writing</span>
            </button>
            <button
              onClick={() => setActiveTab('mmlu')}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                activeTab === 'mmlu' ? 'text-black' : 'text-fg-muted hover:text-fg'
              }`}
            >
              {activeTab === 'mmlu' && (
                <motion.span
                  layoutId="tab-bg"
                  className="absolute inset-0 bg-accent rounded-full"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Brain className="w-4 h-4 relative z-10" />
              <span className="relative z-10">MMLU-Pro</span>
            </button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          {activeTab === 'writing' ? (
            <FilterControls
              modelOptions={filterOptions.modelOptions}
              samplerOptions={filterOptions.samplerOptions}
              selectedModels={selectedModels}
              selectedSamplers={selectedSamplers}
              onModelChange={setSelectedModels}
              onSamplerChange={setSelectedSamplers}
              onReset={resetFilters}
              aggregateAcrossModels={aggregateAcrossModels}
              onAggregateChange={setAggregateAcrossModels}
            />
          ) : (
            <FilterControls
              modelOptions={mmlu.filterOptions.modelOptions}
              samplerOptions={mmlu.filterOptions.samplerOptions}
              selectedModels={mmlu.selectedModels}
              selectedSamplers={mmlu.selectedSamplers}
              onModelChange={mmlu.setSelectedModels}
              onSamplerChange={mmlu.setSelectedSamplers}
              onReset={mmlu.resetFilters}
              aggregateAcrossModels={mmlu.aggregateAcrossModels}
              onAggregateChange={mmlu.setAggregateAcrossModels}
            />
          )}
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center py-20"
            >
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <GlassPanel variant="subtle" className="text-center py-12">
                <p className="text-fg-muted">Unable to load benchmark data</p>
                <p className="text-sm text-fg-subtle mt-2">{error}</p>
              </GlassPanel>
            </motion.div>
          ) : data && data.length > 0 ? (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between flex-wrap gap-2">
                    <span>
                      {activeTab === 'writing' ? 'Writing Quality Rankings' : 'MMLU Accuracy Rankings'}
                    </span>
                    <Badge variant="secondary">
                      {data.length} entries
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.map((entry, index) => {
                      const id = `${entry.model_name}-${entry.sampler_name}`
                      const isExpanded = expandedRows.has(id)
                      const score = activeTab === 'writing'
                        ? entry.average_score
                        : entry.average_score * 100

                      return (
                        <motion.div
                          key={id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(index * 0.02, 0.5) }}
                        >
                          <div
                            className={`p-4 rounded-xl border transition-all duration-200 ${
                              activeTab === 'writing' ? 'cursor-pointer' : ''
                            } ${
                              isExpanded && activeTab === 'writing'
                                ? 'bg-surface-elevated border-border-accent'
                                : 'bg-surface/50 border-border-subtle hover:border-border'
                            }`}
                            onClick={() => activeTab === 'writing' && toggleRowExpansion(id)}
                          >
                            <div className="flex items-center gap-4">
                              <RankBadge rank={index + 1} />

                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-fg truncate">
                                  {entry.model_name}
                                </p>
                                <p className="text-sm text-fg-muted truncate">
                                  {entry.sampler_name}
                                </p>
                              </div>

                              <div className="text-right flex items-center gap-3">
                                <div>
                                  <p className="text-xl font-mono font-medium text-accent">
                                    {activeTab === 'writing'
                                      ? score.toFixed(2)
                                      : `${score.toFixed(1)}%`
                                    }
                                  </p>
                                  <p className="text-xs text-fg-subtle">
                                    {entry.total_samples} samples
                                  </p>
                                </div>
                                {activeTab === 'writing' && (
                                  <button className="p-1 text-fg-muted hover:text-fg transition-colors">
                                    {isExpanded ? (
                                      <ChevronUp className="w-5 h-5" />
                                    ) : (
                                      <ChevronDown className="w-5 h-5" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Expanded Details */}
                            <AnimatePresence>
                              {isExpanded && activeTab === 'writing' && entry.criteria_breakdown && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-4 pt-4 border-t border-border-subtle">
                                    <p className="text-sm text-fg-muted mb-3">Criteria Breakdown</p>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                      {Object.entries(entry.criteria_breakdown).map(([key, value]) => (
                                        <div key={key} className="text-center p-2 bg-surface rounded-lg">
                                          <p className="text-xs text-fg-subtle capitalize mb-1">
                                            {key.replace(/_/g, ' ')}
                                          </p>
                                          <p className="font-mono font-medium text-fg">
                                            {value.toFixed(2)}
                                          </p>
                                        </div>
                                      ))}
                                    </div>

                                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                                      {entry.instruction_compliance !== undefined && (
                                        <div>
                                          <span className="text-fg-subtle">Instruction Compliance: </span>
                                          <span className={`font-medium ${
                                            entry.instruction_compliance >= 0.8 ? 'text-accent' :
                                            entry.instruction_compliance >= 0.5 ? 'text-fg' : 'text-fg-muted'
                                          }`}>
                                            {(entry.instruction_compliance * 100).toFixed(0)}%
                                          </span>
                                          {entry.samples_in_range !== undefined && (
                                            <span className="text-fg-subtle ml-1">
                                              ({entry.samples_in_range}/{entry.total_samples} in range)
                                            </span>
                                          )}
                                        </div>
                                      )}
                                      {entry.avg_consensus_strength !== undefined && (
                                        <div>
                                          <span className="text-fg-subtle">Consensus: </span>
                                          <span className="text-fg font-medium">
                                            {(entry.avg_consensus_strength * 100).toFixed(1)}%
                                          </span>
                                        </div>
                                      )}
                                      {entry.avg_word_count && (
                                        <div>
                                          <span className="text-fg-subtle">Avg words: </span>
                                          <span className="text-fg font-medium">
                                            {entry.avg_word_count.toFixed(0)}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <GlassPanel variant="subtle" className="text-center py-12">
                <p className="text-fg-muted">No data available</p>
              </GlassPanel>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default function LeaderboardPage() {
  return (
    <MmluProvider>
      <LeaderboardContent />
    </MmluProvider>
  )
}
