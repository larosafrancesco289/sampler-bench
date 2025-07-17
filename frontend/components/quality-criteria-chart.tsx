"use client"

import { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useBenchmarkContext } from "@/contexts/benchmark-context"
import { Badge } from "@/components/ui/badge"

// Theme-aware colors that work in both light and dark modes
const getChartColors = () => [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))', 
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-6))',
  'hsl(var(--chart-7))',
  'hsl(var(--chart-8))',
  'hsl(var(--chart-9))',
  'hsl(var(--chart-10))'
]

export function QualityCriteriaChart() {
  const { data, loading, error, hasActiveFilters } = useBenchmarkContext()
  const [maxItemsToShow] = useState(8) // Limit items to prevent overcrowding

  // Transform criteria names for display
  const formatCriterionName = (criterion: string) => {
    return criterion
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Get all unique criteria
  const allCriteria = useMemo(() => {
    const criteriaSet = new Set<string>()
    data.forEach(entry => {
      Object.keys(entry.criteria_breakdown).forEach(criterion => {
        criteriaSet.add(criterion)
      })
    })
    return Array.from(criteriaSet)
  }, [data])

  // Limit data to prevent chart overcrowding
  const displayData = useMemo(() => {
    if (data.length <= maxItemsToShow) {
      return data
    }
    return data.slice(0, maxItemsToShow)
  }, [data, maxItemsToShow])

  // Create chart data for bar chart
  const barChartData = useMemo(() => {
    return displayData.map((entry) => {
      const entryName = entry.sampler_name
      const dataPoint: Record<string, unknown> = {
        name: entryName.length > 20 ? entryName.substring(0, 17) + '...' : entryName,
        fullName: entryName
      }
      
      allCriteria.forEach(criterion => {
        dataPoint[formatCriterionName(criterion)] = entry.criteria_breakdown[criterion] || 0
      })
      
      return dataPoint
    })
  }, [displayData, allCriteria])

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

  if (data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
          {hasActiveFilters ? 'No data matches the current filters' : 'No data available'}
        </div>
      </div>
    )
  }

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.2} />
        <XAxis 
          dataKey="name" 
          angle={-45}
          textAnchor="end"
          height={60}
          tick={{ fontSize: 10, fill: 'currentColor' }}
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
          labelFormatter={(label) => {
            const item = barChartData.find(d => d.name === label)
            return item?.fullName || label
          }}
          formatter={(value: number, name: string) => [value.toFixed(2), name]}
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
        {allCriteria.map((criterion, index) => (
          <Bar
            key={criterion}
            dataKey={formatCriterionName(criterion)}
            fill={getChartColors()[index % getChartColors().length]}
            opacity={0.8}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )

  return (
    <div className="space-y-4">
      {/* Show item count if limited */}
      {data.length > maxItemsToShow && (
        <div className="flex justify-end">
          <Badge variant="secondary" className="text-xs">
            Showing top {maxItemsToShow} of {data.length} entries
          </Badge>
        </div>
      )}

      {/* Chart */}
      <div className="h-80 transition-all duration-300">
        {renderBarChart()}
      </div>

      {/* Criteria Legend */}
      <div className="flex flex-wrap gap-2 justify-center">
        {allCriteria.map((criterion, index) => (
          <Badge
            key={criterion}
            variant="outline"
            className="text-xs"
            style={{ borderColor: getChartColors()[index % getChartColors().length], color: getChartColors()[index % getChartColors().length] }}
          >
            {formatCriterionName(criterion)}
          </Badge>
        ))}
      </div>
    </div>
  )
} 