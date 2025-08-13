"use client"

import React, { createContext, useContext, ReactNode } from 'react'
import { useMmluData } from '@/hooks/use-mmlu-data'
import type { LeaderboardEntry, BenchmarkResults } from '@/types/benchmark'

interface FilterOption {
  value: string
  label: string
  count: number
}

interface MmluContextType {
  data: LeaderboardEntry[]
  summary: unknown
  loading: boolean
  error: string | null
  refetch: () => void
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
  rawData: BenchmarkResults[]
}

const MmluContext = createContext<MmluContextType | undefined>(undefined)

interface MmluProviderProps {
  children: ReactNode
}

export function MmluProvider({ children }: MmluProviderProps) {
  const mmluData = useMmluData()

  return (
    <MmluContext.Provider value={mmluData as unknown as MmluContextType}>
      {children}
    </MmluContext.Provider>
  )
}

export function useMmluContext() {
  const context = useContext(MmluContext)
  if (context === undefined) {
    throw new Error('useMmluContext must be used within a MmluProvider')
  }
  return context
}


