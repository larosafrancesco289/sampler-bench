"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts'
import { useBenchmarkContext } from "@/contexts/benchmark-context"

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

  // Transform data for the chart
  const chartData = data.map((entry, index) => {
    const displayName = entry.sampler_name
    
    return {
      name: displayName,
      score: Number(entry.average_score.toFixed(2)),
      fill: getChartColors()[index % getChartColors().length]
    }
  })

  return (
    <div className="h-80 transition-all duration-300">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 8, fill: 'currentColor' }}
            angle={-45}
            textAnchor="end"
            height={120}
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
  )
} 