import { useState, useEffect } from 'react'
import type { ApiResponse, LeaderboardEntry } from '@/types/benchmark'

export function useBenchmarkData() {
  const [data, setData] = useState<LeaderboardEntry[]>([])
  const [summary, setSummary] = useState<ApiResponse['summary'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/results')
        if (!response.ok) {
          throw new Error(`Failed to fetch results: ${response.statusText}`)
        }
        
        const apiResponse: ApiResponse = await response.json()
        setData(apiResponse.leaderboard)
        setSummary(apiResponse.summary)
      } catch (err) {
        console.error('Error fetching benchmark results:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { data, summary, loading, error, refetch: () => window.location.reload() }
} 