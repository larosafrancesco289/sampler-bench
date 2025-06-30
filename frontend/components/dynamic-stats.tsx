"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useBenchmarkData } from "@/hooks/use-benchmark-data"

export function DynamicStats() {
  const { summary, loading, error } = useBenchmarkData()

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Error</CardTitle>
            <CardDescription>Failed to load statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-red-600">Unable to load data</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Total Samples</CardTitle>
          <CardDescription>Evaluated across all strategies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600">{summary.total_samples}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Sampling Strategies</CardTitle>
          <CardDescription>Quality-tested approaches</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">{summary.unique_samplers}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Avg Quality Score</CardTitle>
          <CardDescription>Overall writing quality (1-10)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-purple-600">{summary.avg_quality_score}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Models Tested</CardTitle>
          <CardDescription>Different language models</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-orange-600">{summary.models_tested}</div>
        </CardContent>
      </Card>
    </div>
  )
} 