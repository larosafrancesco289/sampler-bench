"use client"

import React, { createContext, useContext, ReactNode } from 'react'
import { useBenchmarkData } from '@/hooks/use-benchmark-data'
import type { LeaderboardEntry, ApiResponse } from '@/types/benchmark'

interface FilterOption {
  value: string
  label: string
  count: number
}

interface BenchmarkContextType {
  data: LeaderboardEntry[]
  summary: ApiResponse['summary'] | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  // Filter controls
  filterOptions: {
    modelOptions: FilterOption[]
    samplerOptions: FilterOption[]
  }
  selectedModels: string[]
  selectedSamplers: string[]
  setSelectedModels: (models: string[]) => void
  setSelectedSamplers: (samplers: string[]) => void
  resetFilters: () => void
  hasActiveFilters: boolean
  // Aggregation controls
  aggregateAcrossModels: boolean
  setAggregateAcrossModels: (aggregate: boolean) => void
}

const BenchmarkContext = createContext<BenchmarkContextType | undefined>(undefined)

interface BenchmarkProviderProps {
  children: ReactNode
}

export function BenchmarkProvider({ children }: BenchmarkProviderProps) {
  const benchmarkData = useBenchmarkData()

  return (
    <BenchmarkContext.Provider value={benchmarkData}>
      {children}
    </BenchmarkContext.Provider>
  )
}

export function useBenchmarkContext() {
  const context = useContext(BenchmarkContext)
  if (context === undefined) {
    throw new Error('useBenchmarkContext must be used within a BenchmarkProvider')
  }
  return context
}