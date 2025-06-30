import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LeaderboardTable } from "@/components/leaderboard-table"
import { ScoreChart } from "@/components/score-chart"
import { QualityCriteriaChart } from "@/components/quality-criteria-chart"

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

      {/* Stats Overview - Real Data */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Total Samples</CardTitle>
            <CardDescription>Evaluated across all strategies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">24</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Sampling Strategies</CardTitle>
            <CardDescription>Quality-tested approaches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">4</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Avg Quality Score</CardTitle>
            <CardDescription>Overall writing quality (1-10)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">6.3</div>
          </CardContent>
        </Card>
      </div>

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