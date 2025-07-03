"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts'
import { useBenchmarkContext } from "@/contexts/benchmark-context"

const colors = ['#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#f97316', '#84cc16']

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

  // Transform data for the chart
  const chartData = data.map((entry, index) => {
    const displayName = entry.model_name ? 
      `${entry.sampler_name} (${entry.model_name})` : 
      entry.sampler_name
    
    return {
      name: displayName.length > 25 ? displayName.substring(0, 22) + '...' : displayName,
      fullName: displayName,
      score: Number(entry.average_score.toFixed(2)),
      fill: colors[index % colors.length]
    }
  })

  return (
    <div className="h-80 transition-all duration-300">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12, fill: 'currentColor' }}
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
            labelFormatter={(label) => {
              const item = chartData.find(d => d.name === label)
              return item?.fullName || label
            }}
            formatter={(value: number) => [value.toFixed(2), 'Score']}
          />
          <Bar 
            dataKey="score" 
            className="transition-all duration-300 hover:opacity-80"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
} 