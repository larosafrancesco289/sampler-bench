"use client"

import { useState } from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Filter, RotateCcw } from "lucide-react"

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
}

export function FilterControls({
  modelOptions,
  samplerOptions,
  selectedModels,
  selectedSamplers,
  onModelChange,
  onSamplerChange,
  onReset
}: FilterControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const hasActiveFilters = selectedModels.length > 0 || selectedSamplers.length > 0

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

  const clearModelFilters = () => onModelChange([])
  const clearSamplerFilters = () => onSamplerChange([])

  return (
    <Card className="mb-6 transition-all duration-300 hover:shadow-md dark:hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-lg">Filters</CardTitle>
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs">
                {(selectedModels.length + selectedSamplers.length)} active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="h-8 px-2 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 px-2"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0 space-y-4">
          {/* Model Filters */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Models ({modelOptions.length})
              </h4>
              {selectedModels.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearModelFilters}
                  className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {modelOptions.map((option) => (
                <Badge
                  key={option.value}
                  variant={selectedModels.includes(option.value) ? "default" : "outline"}
                  className="cursor-pointer transition-all duration-200 hover:scale-105"
                  onClick={() => toggleModel(option.value)}
                >
                  {option.label}
                  <span className="ml-1 text-xs opacity-70">({option.count})</span>
                </Badge>
              ))}
            </div>
          </div>

          {/* Sampler Filters */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Samplers ({samplerOptions.length})
              </h4>
              {selectedSamplers.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSamplerFilters}
                  className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {samplerOptions.map((option) => (
                <Badge
                  key={option.value}
                  variant={selectedSamplers.includes(option.value) ? "default" : "outline"}
                  className="cursor-pointer transition-all duration-200 hover:scale-105"
                  onClick={() => toggleSampler(option.value)}
                >
                  {option.label}
                  <span className="ml-1 text-xs opacity-70">({option.count})</span>
                </Badge>
              ))}
            </div>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Active filters:</div>
              <div className="flex flex-wrap gap-1">
                {selectedModels.map((model) => (
                  <Badge key={`model-${model}`} variant="secondary" className="text-xs">
                    Model: {model}
                    <X
                      className="h-3 w-3 ml-1 cursor-pointer"
                      onClick={() => toggleModel(model)}
                    />
                  </Badge>
                ))}
                {selectedSamplers.map((sampler) => (
                  <Badge key={`sampler-${sampler}`} variant="secondary" className="text-xs">
                    Sampler: {sampler}
                    <X
                      className="h-3 w-3 ml-1 cursor-pointer"
                      onClick={() => toggleSampler(sampler)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}