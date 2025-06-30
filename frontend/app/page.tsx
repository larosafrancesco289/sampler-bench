import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LeaderboardTable } from "@/components/leaderboard-table"
import { ScoreChart } from "@/components/score-chart"
import { QualityCriteriaChart } from "@/components/quality-criteria-chart"
import { DynamicStats } from "@/components/dynamic-stats"

export default function Dashboard() {
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Sampler Bench Leaderboard
        </h1>
        <p className="text-lg text-gray-600">
          Hardware-agnostic quality evaluation of LLM sampling strategies on creative writing tasks
        </p>
      </div>

      {/* Dynamic Stats Overview */}
      <DynamicStats />

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Overall Quality Scores</CardTitle>
            <CardDescription>Average quality ratings by sampling strategy</CardDescription>
          </CardHeader>
          <CardContent>
            <ScoreChart />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quality Criteria Breakdown</CardTitle>
            <CardDescription>Detailed evaluation across writing dimensions</CardDescription>
          </CardHeader>
          <CardContent>
            <QualityCriteriaChart />
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard Table */}
      <Card>
        <CardHeader>
          <CardTitle>Quality Leaderboard</CardTitle>
          <CardDescription>
            Complete ranking of sampling strategies based on writing quality evaluation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeaderboardTable />
        </CardContent>
      </Card>
    </div>
  )
} 