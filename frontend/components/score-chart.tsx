"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts'
import { useBenchmarkContext } from "@/contexts/benchmark-context"
import { useMemo } from 'react'

// Theme-aware colors that work in both light and dark modes
const getChartColors = () => [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))', 
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-6))',
  'hsl(var(--chart-7))'
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
        <div className="text-gray-600 dark:text-gray-300 animate-pulse transition-colors duration-300">Loading chart data...</div>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {modelCharts.map(({ modelName, data: modelData }) => (
          <div key={modelName} className="transition-all duration-300">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
              {modelName}
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
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
                    tick={{ fontSize: 11, fill: 'currentColor' }}
                    stroke="currentColor"
                    opacity={0.7}
                  />
                  <Tooltip
                    formatter={(value: number) => [value.toFixed(2), 'Score']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      color: 'hsl(var(--foreground))'
                    }}
                    labelStyle={{
                      color: 'hsl(var(--foreground))'
                    }}
                    itemStyle={{
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Bar 
                    dataKey="score" 
                    className="transition-all duration-300 hover:opacity-80"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 