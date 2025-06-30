"use client"

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts'
import { useBenchmarkData } from "@/hooks/use-benchmark-data"

const colors = ['#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#f97316', '#84cc16']

export function QualityCriteriaChart() {
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

  // Get all unique criteria
  const allCriteria = new Set<string>()
  data.forEach(entry => {
    Object.keys(entry.criteria_breakdown).forEach(criterion => {
      allCriteria.add(criterion)
    })
  })

  // Transform criteria names for display
  const formatCriterionName = (criterion: string) => {
    return criterion
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Create chart data
  const chartData = Array.from(allCriteria).map(criterion => {
    const point: any = {
      criterion: formatCriterionName(criterion)
    }
    
    data.forEach((entry, index) => {
      const samplerKey = entry.sampler_name.replace(/[^a-zA-Z0-9]/g, '_')
      point[samplerKey] = entry.criteria_breakdown[criterion] || 0
    })
    
    return point
  })

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="criterion" tick={{ fontSize: 10 }} />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 10]} 
            tick={{ fontSize: 8 }}
          />
          {data.map((entry, index) => {
            const samplerKey = entry.sampler_name.replace(/[^a-zA-Z0-9]/g, '_')
            return (
              <Radar
                key={samplerKey}
                name={entry.sampler_name}
                dataKey={samplerKey}
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.1}
                strokeWidth={2}
              />
            )
          })}
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
} 