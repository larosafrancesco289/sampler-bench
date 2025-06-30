"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { useBenchmarkData } from "@/hooks/use-benchmark-data"

const colors = ['#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#f97316', '#84cc16']

export function ScoreChart() {
  const { data, loading, error } = useBenchmarkData()

  if (loading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="text-gray-600">Loading chart data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="text-red-600">Error loading chart data</div>
      </div>
    )
  }

  // Transform data for the chart
  const chartData = data.map((entry, index) => ({
    name: entry.sampler_name,
    score: Number(entry.average_score.toFixed(2)),
    fill: colors[index % colors.length]
  }))

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            domain={[0, 10]}
            tick={{ fontSize: 12 }}
          />
          <Bar dataKey="score" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
} 