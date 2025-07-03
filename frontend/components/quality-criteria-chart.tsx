"use client"

import { useState, useMemo } from 'react'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { useBenchmarkContext } from "@/contexts/benchmark-context"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Badge } from "@/components/ui/badge"

const colors = ['#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#f97316', '#84cc16', '#ec4899', '#06b6d4', '#84cc16']

type ChartType = 'radar' | 'bar'

export function QualityCriteriaChart() {
  const { data, loading, error, hasActiveFilters } = useBenchmarkContext()
  const [chartType, setChartType] = useState<ChartType>('radar')
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

  // Create chart data for radar chart
  const radarChartData = useMemo(() => {
    return allCriteria.map(criterion => {
      const point: Record<string, unknown> = {
        criterion: formatCriterionName(criterion)
      }
      
      displayData.forEach((entry) => {
        const entryKey = `${entry.sampler_name}${entry.model_name ? ` (${entry.model_name})` : ''}`
        const samplerKey = entryKey.replace(/[^a-zA-Z0-9]/g, '_')
        point[samplerKey] = entry.criteria_breakdown[criterion] || 0
      })
      
      return point
    })
  }, [allCriteria, displayData])

  // Create chart data for bar chart
  const barChartData = useMemo(() => {
    return displayData.map((entry) => {
      const entryName = `${entry.sampler_name}${entry.model_name ? ` (${entry.model_name})` : ''}`
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

  const renderRadarChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={radarChartData}>
        <PolarGrid stroke="currentColor" opacity={0.2} />
        <PolarAngleAxis 
          dataKey="criterion" 
          tick={{ fontSize: 9, fill: 'currentColor' }}
          className="text-gray-700 dark:text-gray-300"
        />
        <PolarRadiusAxis 
          angle={90} 
          domain={[0, 10]} 
          tick={{ fontSize: 8, fill: 'currentColor' }}
          stroke="currentColor"
          opacity={0.5}
        />
        {displayData.map((entry, index) => {
          const entryKey = `${entry.sampler_name}${entry.model_name ? ` (${entry.model_name})` : ''}`
          const samplerKey = entryKey.replace(/[^a-zA-Z0-9]/g, '_')
          const displayName = entryKey.length > 25 ? entryKey.substring(0, 22) + '...' : entryKey
          
          return (
            <Radar
              key={samplerKey}
              name={displayName}
              dataKey={samplerKey}
              stroke={colors[index % colors.length]}
              fill={colors[index % colors.length]}
              fillOpacity={0.1}
              strokeWidth={2}
              className="transition-all duration-300"
            />
          )
        })}
        <Legend 
          wrapperStyle={{ 
            color: 'currentColor',
            fontSize: '10px'
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  )

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis 
          dataKey="name" 
          angle={-45}
          textAnchor="end"
          height={60}
          fontSize={10}
        />
        <YAxis 
          domain={[0, 10]}
          fontSize={10}
        />
        <Tooltip 
          labelFormatter={(label) => {
            const item = barChartData.find(d => d.name === label)
            return item?.fullName || label
          }}
          formatter={(value: number, name: string) => [value.toFixed(2), name]}
        />
        {allCriteria.map((criterion, index) => (
          <Bar
            key={criterion}
            dataKey={formatCriterionName(criterion)}
            fill={colors[index % colors.length]}
            opacity={0.8}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )

  return (
    <div className="space-y-4">
      {/* Chart Controls */}
      <div className="flex items-center justify-between">
        <ToggleGroup type="single" value={chartType} onValueChange={(value: string) => value && setChartType(value as ChartType)}>
          <ToggleGroupItem value="radar" aria-label="Radar Chart">
            Radar
          </ToggleGroupItem>
          <ToggleGroupItem value="bar" aria-label="Bar Chart">
            Bar
          </ToggleGroupItem>
        </ToggleGroup>
        
        {data.length > maxItemsToShow && (
          <Badge variant="secondary" className="text-xs">
            Showing top {maxItemsToShow} of {data.length} entries
          </Badge>
        )}
      </div>

      {/* Chart */}
      <div className="h-80 transition-all duration-300">
        {chartType === 'radar' ? renderRadarChart() : renderBarChart()}
      </div>

      {/* Criteria Legend for Bar Chart */}
      {chartType === 'bar' && (
        <div className="flex flex-wrap gap-2 justify-center">
          {allCriteria.map((criterion, index) => (
            <Badge
              key={criterion}
              variant="outline"
              className="text-xs"
              style={{ borderColor: colors[index % colors.length], color: colors[index % colors.length] }}
            >
              {formatCriterionName(criterion)}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
} 