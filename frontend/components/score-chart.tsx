"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from 'recharts'
import { useBenchmarkContext } from "@/contexts/benchmark-context"
import { useMemo } from 'react'

// Colorblind-friendly palette leveraging tokens + pattern fills for redundancy
const getChartColors = () => [
  'var(--color-accent)', // gold
  'var(--color-accent-2)', // imperial purple
  'color-mix(in oklab, var(--color-accent) 70%, white)',
  'color-mix(in oklab, var(--color-accent-2) 70%, white)',
  'color-mix(in oklab, var(--color-accent) 55%, white)',
  'color-mix(in oklab, var(--color-accent-2) 55%, white)',
  'color-mix(in oklab, var(--color-accent) 40%, white)'
]

export function ScoreChart() {
  const { data, loading, error } = useBenchmarkContext()


  // Group chart data by model for separate charts
  const modelCharts = useMemo(() => {
    if (!data || data.length === 0) return []
    const modelGroups = data.reduce((acc, entry) => {
      const modelName = entry.model_name || 'Unknown Model'
      if (!acc[modelName]) {
        acc[modelName] = []
      }
      acc[modelName].push(entry)
      return acc
    }, {} as Record<string, typeof data>)

    return Object.entries(modelGroups).map(([modelName, entries]) => {
      const sortedEntries = entries.sort((a, b) => b.average_score - a.average_score)
      const colors = getChartColors()
      
      return {
        modelName,
        data: sortedEntries.map((entry, index) => ({
          name: entry.sampler_name,
          score: Number(entry.average_score.toFixed(2)),
          fill: colors[index % colors.length]
        }))
      }
    })
  }, [data])

  if (loading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="text-fg-muted animate-pulse transition-colors duration-300">Loading chart data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="text-red-600 dark:text-red-400 transition-colors duration-300">Error loading chart data</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Model Charts in Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {modelCharts.map(({ modelName, data: modelData }) => (
          <div key={modelName} className="transition-all duration-300">
            <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-fg break-words">
              {modelName}
            </h3>
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 9, fill: 'currentColor' }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    stroke="currentColor"
                    opacity={0.7}
                  />
                  <YAxis 
                    domain={[0, 10]}
                    tick={{ fontSize: 10, fill: 'currentColor' }}
                    stroke="currentColor"
                    opacity={0.7}
                  />
                  <Tooltip
                    formatter={(value: number) => [value.toFixed(2), 'Score']}
                    contentStyle={{
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      color: 'var(--color-fg)'
                    }}
                    labelStyle={{
                      color: 'var(--color-fg)'
                    }}
                    itemStyle={{
                      color: 'var(--color-fg)'
                    }}
                  />
                  <Bar 
                    dataKey="score" 
                    className="transition-all duration-300 hover:opacity-80"
                    radius={[4, 4, 0, 0]}
                  >
                    {modelData.map((entry, idx) => (
                      <Cell key={`cell-${modelName}-${idx}`} fill={entry.fill} stroke="var(--color-border)" strokeWidth={0.6} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 