"use client"

import { useState } from 'react'
import { X, SlidersHorizontal, RotateCcw, ChevronDown, ChevronUp, Layers, Cpu } from "lucide-react"

interface FilterOption {
  value: string
  label: string
  count: number
}

interface FilterControlsProps {
  modelOptions: FilterOption[]
  samplerOptions: FilterOption[]
  selectedModels: string[]
  selectedSamplers: string[]
  onModelChange: (models: string[]) => void
  onSamplerChange: (samplers: string[]) => void
  onReset: () => void
  aggregateAcrossModels?: boolean
  onAggregateChange?: (aggregate: boolean) => void
  hideAggregation?: boolean
}

export function FilterControls({
  modelOptions,
  samplerOptions,
  selectedModels,
  selectedSamplers,
  onModelChange,
  onSamplerChange,
  onReset,
  aggregateAcrossModels = false,
  onAggregateChange,
  hideAggregation
}: FilterControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const hasActiveFilters = selectedModels.length > 0 || selectedSamplers.length > 0
  const activeCount = selectedModels.length + selectedSamplers.length

  const toggleModel = (model: string) => {
    if (selectedModels.includes(model)) {
      onModelChange(selectedModels.filter(m => m !== model))
    } else {
      onModelChange([...selectedModels, model])
    }
  }

  const toggleSampler = (sampler: string) => {
    if (selectedSamplers.includes(sampler)) {
      onSamplerChange(selectedSamplers.filter(s => s !== sampler))
    } else {
      onSamplerChange([...selectedSamplers, sampler])
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-border bg-surface/50 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[var(--color-accent)]/10">
            <SlidersHorizontal className="w-4 h-4 text-[var(--color-accent)]" />
          </div>
          <div>
            <h3 className="font-medium text-fg">Filters</h3>
            <p className="text-xs text-fg-muted">
              {hasActiveFilters ? `${activeCount} filter${activeCount > 1 ? 's' : ''} active` : 'Showing all data'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={(e) => { e.stopPropagation(); onReset() }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-fg-muted hover:text-fg rounded-lg hover:bg-muted transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
          <div className="text-fg-muted">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-5 border-t border-border-subtle">
          {/* Models Section */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-fg-muted" />
                <span className="text-sm font-medium text-fg">Models</span>
                <span className="text-xs text-fg-muted">({modelOptions.length})</span>
              </div>
              <div className="flex gap-2">
                {selectedModels.length === 0 ? (
                  <button
                    onClick={() => onModelChange(modelOptions.map(m => m.value))}
                    className="text-xs text-[var(--color-accent)] hover:underline"
                  >
                    Select all
                  </button>
                ) : (
                  <button
                    onClick={() => onModelChange([])}
                    className="text-xs text-fg-muted hover:text-fg flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {modelOptions.map((option) => {
                const isSelected = selectedModels.includes(option.value)
                return (
                  <button
                    key={option.value}
                    onClick={() => toggleModel(option.value)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-all duration-200 ${
                      isSelected
                        ? 'bg-[var(--color-accent)] text-black border-transparent'
                        : 'bg-transparent text-fg-muted border-border hover:border-[var(--color-accent)]/50 hover:text-fg'
                    }`}
                  >
                    {option.label}
                    <span className={`text-xs ${isSelected ? 'text-black/60' : 'text-fg-muted/60'}`}>
                      {option.count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Samplers Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-fg-muted" />
                <span className="text-sm font-medium text-fg">Sampling Strategies</span>
                <span className="text-xs text-fg-muted">({samplerOptions.length})</span>
              </div>
              <div className="flex gap-2">
                {selectedSamplers.length === 0 ? (
                  <button
                    onClick={() => onSamplerChange(samplerOptions.map(s => s.value))}
                    className="text-xs text-[var(--color-accent)] hover:underline"
                  >
                    Select all
                  </button>
                ) : (
                  <button
                    onClick={() => onSamplerChange([])}
                    className="text-xs text-fg-muted hover:text-fg flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {samplerOptions.map((option) => {
                const isSelected = selectedSamplers.includes(option.value)
                return (
                  <button
                    key={option.value}
                    onClick={() => toggleSampler(option.value)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-all duration-200 ${
                      isSelected
                        ? 'bg-[var(--color-accent-2)] text-white border-transparent'
                        : 'bg-transparent text-fg-muted border-border hover:border-[var(--color-accent-2)]/50 hover:text-fg'
                    }`}
                  >
                    {option.label}
                    <span className={`text-xs ${isSelected ? 'text-white/60' : 'text-fg-muted/60'}`}>
                      {option.count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Aggregation Toggle */}
          {!hideAggregation && onAggregateChange && (
            <div className="pt-4 border-t border-border-subtle">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-fg">Aggregate View</h4>
                  <p className="text-xs text-fg-muted mt-0.5">
                    Combine scores across all models
                  </p>
                </div>
                <button
                  onClick={() => onAggregateChange(!aggregateAcrossModels)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    aggregateAcrossModels ? 'bg-[var(--color-accent)]' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                      aggregateAcrossModels ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}