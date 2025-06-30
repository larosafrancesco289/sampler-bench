"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { LeaderboardEntry } from "@/types/benchmark"
import { getMockDataFromRealResults } from "@/lib/data-processor"

export function LeaderboardTable() {
  const [data, setData] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load real benchmark results data
    setTimeout(() => {
      setData(getMockDataFromRealResults())
      setLoading(false)
    }, 1000)
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {data.map((entry, index) => (
        <div
          key={entry.sampler_name}
          className="border rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                {index + 1}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{entry.sampler_name}</h3>
                <p className="text-sm text-gray-600">{entry.description}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {entry.average_score.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">
                {entry.total_samples} samples
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quality Criteria Breakdown */}
            <div>
              <h4 className="font-medium mb-3 text-gray-700">Quality Criteria</h4>
              <div className="space-y-2">
                {Object.entries(entry.criteria_breakdown).map(([criterion, score]) => (
                  <div key={criterion} className="flex items-center justify-between">
                    <span className="text-sm capitalize">
                      {criterion.replace(/_/g, ' ')}
                    </span>
                    <div className="flex items-center space-x-2">
                      <Progress value={score * 10} className="w-16 h-2" />
                      <span className="text-sm font-medium w-8">
                        {score.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Parameters & Word Count */}
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-3 text-gray-700">Output Quality</h4>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-lg font-medium">{entry.avg_word_count}</div>
                  <div className="text-sm text-gray-500">avg words per sample</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3 text-gray-700">Sampling Parameters</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(entry.parameters).map(([key, value]) => (
                    <Badge key={key} variant="secondary" className="text-xs">
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