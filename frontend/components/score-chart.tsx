"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts'
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

  // Transform data for the chart - group by model, then show samplers within each model
  const chartData = useMemo(() => {
    // Group entries by model
    const modelGroups = data.reduce((acc, entry) => {
      const modelName = entry.model_name || 'Unknown Model'
      if (!acc[modelName]) {
        acc[modelName] = []
      }
      acc[modelName].push(entry)
      return acc
    }, {} as Record<string, typeof data>)

    // Create chart data with model-grouped sampling methods
    const result = []
    const colors = getChartColors()
    
    Object.entries(modelGroups).forEach(([modelName, entries]) => {
      // Sort entries by score within each model for consistent display
      const sortedEntries = entries.sort((a, b) => b.average_score - a.average_score)
      
      sortedEntries.forEach((entry, index) => {
        result.push({
          name: entry.sampler_name,
          score: Number(entry.average_score.toFixed(2)),
          model: modelName,
          fill: colors[index % colors.length],
          // Add grouping info for better display
          groupKey: `${modelName}-${entry.sampler_name}`
        })
      })
    })
    
    return result
  }, [data])

  // Group chart data by model for separate charts
  const modelCharts = useMemo(() => {
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

  return (
    <div className="space-y-6">
      {modelCharts.map(({ modelName, data: modelData }) => (
        <div key={modelName} className="transition-all duration-300">
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
            {modelName}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10, fill: 'currentColor' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  stroke="currentColor"
                  opacity={0.7}
                />
                <YAxis 
                  domain={[0, 10]}
                  tick={{ fontSize: 12, fill: 'currentColor' }}
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
  )
} 