"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useBenchmarkData } from "@/hooks/use-benchmark-data"

export function DynamicStats() {
  const { summary, loading, error } = useBenchmarkData()

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="transition-all duration-300 hover:scale-105">
            <CardHeader className="pb-3">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2 transition-colors duration-300"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 transition-colors duration-300"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 transition-colors duration-300"></div>
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
        <Card className="transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Error</CardTitle>
            <CardDescription>Failed to load statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-red-600 dark:text-red-400 transition-colors duration-300">Unable to load data</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card className="transition-all duration-300 hover:scale-105 hover:shadow-lg dark:hover:shadow-xl group">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg transition-colors duration-300">Total Samples</CardTitle>
          <CardDescription className="transition-colors duration-300">Evaluated across all strategies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 transition-all duration-300 group-hover:scale-110">{summary.total_samples}</div>
        </CardContent>
      </Card>
      
      <Card className="transition-all duration-300 hover:scale-105 hover:shadow-lg dark:hover:shadow-xl group">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg transition-colors duration-300">Sampling Strategies</CardTitle>
          <CardDescription className="transition-colors duration-300">Quality-tested approaches</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400 transition-all duration-300 group-hover:scale-110">{summary.unique_samplers}</div>
        </CardContent>
      </Card>
      
      <Card className="transition-all duration-300 hover:scale-105 hover:shadow-lg dark:hover:shadow-xl group">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg transition-colors duration-300">Avg Quality Score</CardTitle>
          <CardDescription className="transition-colors duration-300">Overall writing quality (1-10)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 transition-all duration-300 group-hover:scale-110">{summary.avg_quality_score}</div>
        </CardContent>
      </Card>

      <Card className="transition-all duration-300 hover:scale-105 hover:shadow-lg dark:hover:shadow-xl group">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg transition-colors duration-300">Models Tested</CardTitle>
          <CardDescription className="transition-colors duration-300">Different language models</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 transition-all duration-300 group-hover:scale-110">{summary.models_tested}</div>
        </CardContent>
      </Card>
    </div>
  )
} 