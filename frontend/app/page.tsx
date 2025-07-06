"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LeaderboardTable } from "@/components/leaderboard-table"
import { ScoreChart } from "@/components/score-chart"
import { QualityCriteriaChart } from "@/components/quality-criteria-chart"
import { DynamicStats } from "@/components/dynamic-stats"
import { Navigation } from "@/components/navigation"
import { FilterControls } from "@/components/filter-controls"
import { useBenchmarkContext } from "@/contexts/benchmark-context"

function DashboardContent() {
  const {
    filterOptions,
    selectedModels,
    selectedSamplers,
    setSelectedModels,
    setSelectedSamplers,
    resetFilters,
    aggregateAcrossModels,
    setAggregateAcrossModels
  } = useBenchmarkContext()
  return (
    <div className="container mx-auto py-8 px-4">
      <Navigation />

      {/* Filter Controls */}
      <FilterControls
        modelOptions={filterOptions.modelOptions}
        samplerOptions={filterOptions.samplerOptions}
        selectedModels={selectedModels}
        selectedSamplers={selectedSamplers}
        onModelChange={setSelectedModels}
        onSamplerChange={setSelectedSamplers}
        onReset={resetFilters}
        aggregateAcrossModels={aggregateAcrossModels}
        onAggregateChange={setAggregateAcrossModels}
      />

      {/* Dynamic Stats Overview */}
      <div className="animate-fade-in">
        <DynamicStats />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 animate-slide-up">
        <Card className="transition-all duration-300 hover:scale-[1.02] hover:shadow-lg dark:hover:shadow-xl">
          <CardHeader>
            <CardTitle className="transition-colors duration-300">Overall Quality Scores</CardTitle>
            <CardDescription className="transition-colors duration-300">Average quality ratings by sampling strategy</CardDescription>
          </CardHeader>
          <CardContent>
            <ScoreChart />
          </CardContent>
        </Card>
        
        <Card className="transition-all duration-300 hover:scale-[1.02] hover:shadow-lg dark:hover:shadow-xl">
          <CardHeader>
            <CardTitle className="transition-colors duration-300">Quality Criteria Breakdown</CardTitle>
            <CardDescription className="transition-colors duration-300">Detailed evaluation across writing dimensions</CardDescription>
          </CardHeader>
          <CardContent>
            <QualityCriteriaChart />
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard Table */}
      <div className="animate-scale-in">
        <Card className="transition-all duration-300 hover:shadow-lg dark:hover:shadow-xl">
          <CardHeader>
            <CardTitle className="transition-colors duration-300">Quality Leaderboard</CardTitle>
            <CardDescription className="transition-colors duration-300">
              Complete ranking of sampling strategies based on writing quality evaluation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeaderboardTable />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function Dashboard() {
  return <DashboardContent />
} 