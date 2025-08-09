"use client"

import { useState } from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Filter, RotateCcw, Sliders, Target, FileText } from "lucide-react"

interface QualityFiltersProps {
  onCriteriaFilterChange: (criteria: string, minScore: number) => void
  onWordCountFilterChange: (range: [number, number]) => void
  onScoreRangeFilterChange: (range: [number, number]) => void
  onQuickPresetChange: (preset: string) => void
  onReset: () => void
  criteriaFilters: Record<string, number>
  wordCountRange: [number, number]
  scoreRange: [number, number]
  activePreset: string | null
  dataBounds?: {
    maxWordCount: number
    minWordCount: number
    minScore: number
    maxScore: number
  }
}

const CRITERIA_OPTIONS = [
  { value: 'narrative_structure', label: 'Narrative Structure', description: 'Story organization and pacing' },
  { value: 'creativity_execution', label: 'Creativity Execution', description: 'Creative premise and originality' },
  { value: 'character_voice', label: 'Character Voice', description: 'Character development and authenticity' },
  { value: 'prose_quality', label: 'Prose Quality', description: 'Writing craft and style' },
  { value: 'engagement', label: 'Engagement', description: 'Reader interest and impact' },
  // Legacy single judge criteria
  { value: 'narrative_coherence', label: 'Narrative Coherence', description: 'Story flow and consistency' },
  { value: 'creativity_originality', label: 'Creativity & Originality', description: 'Unique ideas and expression' },
  { value: 'character_development', label: 'Character Development', description: 'Character depth and believability' },
  { value: 'engagement_readability', label: 'Engagement & Readability', description: 'Reader engagement and accessibility' },
  { value: 'stylistic_quality', label: 'Stylistic Quality', description: 'Writing technique and language' }
]

const QUICK_PRESETS = [
  { value: 'most_creative', label: 'Most Creative', description: 'High creativity scores' },
  { value: 'best_structure', label: 'Best Structure', description: 'High narrative structure' },
  { value: 'concise_quality', label: 'Concise & Quality', description: 'Short + high quality' },
  { value: 'consistent_performers', label: 'Consistent', description: 'Low variability' },
  { value: 'engaging_writing', label: 'Most Engaging', description: 'High engagement scores' }
]

export function QualityFilters({
  onCriteriaFilterChange,
  onWordCountFilterChange,
  onScoreRangeFilterChange,
  onQuickPresetChange,
  onReset,
  criteriaFilters,
  wordCountRange,
  scoreRange,
  activePreset,
  dataBounds = { maxWordCount: 1000, minWordCount: 0, minScore: 1, maxScore: 10 }
}: QualityFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedCriteria, setSelectedCriteria] = useState<string>("")

  const hasActiveFilters = Object.keys(criteriaFilters).length > 0 || 
                          wordCountRange[0] > dataBounds.minWordCount || wordCountRange[1] < dataBounds.maxWordCount ||
                          scoreRange[0] > dataBounds.minScore || scoreRange[1] < dataBounds.maxScore ||
                          activePreset !== null

  const handleCriteriaChange = (criteria: string, value: number[]) => {
    onCriteriaFilterChange(criteria, value[0])
  }

  const removeCriteriaFilter = (criteria: string) => {
    onCriteriaFilterChange(criteria, 0)
  }

  const handlePresetChange = (preset: string) => {
    if (preset === activePreset) {
      onQuickPresetChange("")
    } else {
      onQuickPresetChange(preset)
    }
  }

  return (
    <Card className="mb-4 transition-all duration-300 hover:shadow-md dark:hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4" />
            <CardTitle className="text-lg">Quality Filters</CardTitle>
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs">
                {Object.keys(criteriaFilters).length + (activePreset ? 1 : 0)} active
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
        <CardContent className="pt-0 space-y-6">
          {/* Quick Presets */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4" />
              <h4 className="text-sm font-medium text-fg">
                Quick Presets
              </h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_PRESETS.map((preset) => (
                <Badge
                  key={preset.value}
                  variant={activePreset === preset.value ? "default" : "outline"}
                  className="cursor-pointer transition-all duration-200 hover:scale-105"
                  onClick={() => handlePresetChange(preset.value)}
                  title={preset.description}
                >
                  {preset.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Score Range Filter */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4" />
              <h4 className="text-sm font-medium text-fg">
                Overall Score Range
              </h4>
            </div>
            <div className="px-3">
              <Slider
                value={scoreRange}
                onValueChange={(value) => onScoreRangeFilterChange(value as [number, number])}
                max={dataBounds.maxScore}
                min={dataBounds.minScore}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-fg-muted mt-1">
                <span>{scoreRange[0].toFixed(1)}</span>
                <span>{scoreRange[1].toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Word Count Filter */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4" />
              <h4 className="text-sm font-medium text-fg">
                Word Count Range
              </h4>
            </div>
            <div className="px-3">
              <Slider
                value={wordCountRange}
                onValueChange={(value) => onWordCountFilterChange(value as [number, number])}
                max={dataBounds.maxWordCount} // Use actual max from data
                min={dataBounds.minWordCount} // Use actual min from data
                step={25}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-fg-muted mt-1">
                <span>{wordCountRange[0]} words</span>
                <span>{wordCountRange[1]} words</span>
              </div>
            </div>
          </div>

          {/* Criteria Filters */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4" />
              <h4 className="text-sm font-medium text-fg">
                Writing Quality Criteria
              </h4>
            </div>
            
            {/* Add New Criteria Filter */}
            <div className="mb-3">
              <Select value={selectedCriteria} onValueChange={setSelectedCriteria}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Add criteria filter..." />
                </SelectTrigger>
                <SelectContent>
                  {CRITERIA_OPTIONS
                    .filter(option => !criteriaFilters[option.value])
                    .map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-fg-muted">{option.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active Criteria Filters */}
            {Object.entries(criteriaFilters).map(([criteria, minScore]) => {
              const criteriaOption = CRITERIA_OPTIONS.find(opt => opt.value === criteria)
              if (!criteriaOption) return null

              return (
                <div key={criteria} className="mb-4 p-3 bg-muted rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm font-medium text-fg">
                        {criteriaOption.label}
                      </div>
                      <div className="text-xs text-fg-muted">
                        {criteriaOption.description}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCriteriaFilter(criteria)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="px-2">
                    <Slider
                      value={[minScore]}
                      onValueChange={(value) => handleCriteriaChange(criteria, value)}
                      max={10}
                      min={1}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-fg-muted mt-1">
                      <span>Min: {minScore.toFixed(1)}</span>
                      <span>Max: 10.0</span>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Add Selected Criteria */}
            {selectedCriteria && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onCriteriaFilterChange(selectedCriteria, 5.0)
                  setSelectedCriteria("")
                }}
                className="w-full"
              >
                Add {CRITERIA_OPTIONS.find(opt => opt.value === selectedCriteria)?.label} Filter
              </Button>
            )}
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="pt-4 border-t border-border">
              <div className="text-xs text-fg-muted mb-2">Active filters:</div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(criteriaFilters).map(([criteria, minScore]) => {
                  const criteriaOption = CRITERIA_OPTIONS.find(opt => opt.value === criteria)
                  return (
                    <Badge key={criteria} variant="secondary" className="text-xs">
                      {criteriaOption?.label}: ≥{minScore.toFixed(1)}
                      <X
                        className="h-3 w-3 ml-1 cursor-pointer"
                        onClick={() => removeCriteriaFilter(criteria)}
                      />
                    </Badge>
                  )
                })}
                {activePreset && (
                  <Badge variant="secondary" className="text-xs">
                    Preset: {QUICK_PRESETS.find(p => p.value === activePreset)?.label}
                    <X
                      className="h-3 w-3 ml-1 cursor-pointer"
                      onClick={() => onQuickPresetChange("")}
                    />
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}