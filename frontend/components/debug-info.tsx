"use client"

import { useBenchmarkContext } from "@/contexts/benchmark-context"

export function DebugInfo() {
  const { 
    data, 
    selectedModels, 
    selectedSamplers, 
    filterOptions,
    hasActiveFilters 
  } = useBenchmarkContext()

  return (
    <div className="bg-muted p-4 rounded-2xl mb-4 text-xs">
      <h4 className="font-bold mb-2">Debug Info:</h4>
      <div>Total raw entries: {data.length}</div>
      <div>Selected models: {JSON.stringify(selectedModels)}</div>
      <div>Selected samplers: {JSON.stringify(selectedSamplers)}</div>
      <div>Has active filters: {hasActiveFilters.toString()}</div>
      <div>Available models: {filterOptions.modelOptions.map(m => m.label).join(', ')}</div>
      <div>Available samplers: {filterOptions.samplerOptions.map(s => s.label).join(', ')}</div>
      <div>Sample data structure:</div>
      <pre className="text-xs overflow-auto">
        {JSON.stringify(data.slice(0, 2), null, 2)}
      </pre>
    </div>
  )
}