"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MmluLeaderboardTable } from "@/components/mmlu-leaderboard-table"
import { Navigation } from "@/components/navigation"
import { FilterControls } from "@/components/filter-controls"
import { useMmluContext, MmluProvider } from "@/contexts/mmlu-context"
import { MmluSamplerMeanChart } from "@/components/mmlu-sampler-mean-chart"

function MmluDashboardContent() {
  const {
    filterOptions,
    selectedModels,
    selectedSamplers,
    setSelectedModels,
    setSelectedSamplers,
    resetFilters
  } = useMmluContext()

  return (
    <div className="container mx-auto py-6 sm:py-8 px-3 sm:px-4">
      <Navigation />

      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold">MMLU-Pro Subset Leaderboard</h2>
        <p className="text-sm sm:text-base text-fg-muted">Objective accuracy by sampling strategy and model</p>
      </div>

      <FilterControls
        modelOptions={filterOptions.modelOptions}
        samplerOptions={filterOptions.samplerOptions}
        selectedModels={selectedModels}
        selectedSamplers={selectedSamplers}
        onModelChange={setSelectedModels}
        onSamplerChange={setSelectedSamplers}
        onReset={resetFilters}
        aggregateAcrossModels={false}
        onAggregateChange={() => {}}
        hideAggregation
      />

      <div className="space-y-6 mb-8 animate-slide-up">
        <Card className="transition-all duration-300 hover:shadow-lg dark:hover:shadow-xl">
          <CardHeader>
            <CardTitle className="transition-colors duration-300">Per-Sampler Mean Accuracy</CardTitle>
            <CardDescription className="text-fg-muted transition-colors duration-300">Mean accuracy by sampling strategy (weighted by sample count)</CardDescription>
          </CardHeader>
          <CardContent>
            <MmluSamplerMeanChart />
          </CardContent>
        </Card>
      </div>

      <div className="animate-scale-in">
        <Card className="transition-all duration-300 hover:shadow-lg dark:hover:shadow-xl">
          <CardHeader>
            <CardTitle className="transition-colors duration-300">MMLU Leaderboard</CardTitle>
            <CardDescription className="text-fg-muted transition-colors duration-300">Sampling strategies ranked by objective accuracy</CardDescription>
          </CardHeader>
          <CardContent>
            <MmluLeaderboardTable />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function MmluDashboard() {
  return (
    <MmluProvider>
      <MmluDashboardContent />
    </MmluProvider>
  )
}


