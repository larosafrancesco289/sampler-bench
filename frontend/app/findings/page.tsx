"use client"

import { useMemo } from 'react'
import { motion } from 'motion/react'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge, RankBadge } from '@/components/ui/badge'
import { GlassPanel } from '@/components/observatory/glass-panel'
import { ProbabilityBackdrop, CurveDivider } from '@/components/observatory/probability-backdrop'
import { useMmluContext, MmluProvider } from '@/contexts/mmlu-context'
import { useBenchmarkContext } from '@/contexts/benchmark-context'
import { TrendingUp, Users, BarChart3, Brain, CheckCircle, AlertTriangle } from 'lucide-react'

function FindingsContent() {
  const { data, summary, loading, error } = useBenchmarkContext()
  const mmlu = useMmluContext()

  const insights = useMemo(() => {
    if (!data || data.length === 0) return null

    const models = [...new Set(data.map(entry => entry.model_name).filter(Boolean))]

    const modelPerformance = models.map(model => {
      const modelEntries = data.filter(entry => entry.model_name === model)
      const avgScore = modelEntries.reduce((sum, entry) => sum + entry.average_score, 0) / modelEntries.length
      const totalSamples = modelEntries.reduce((sum, entry) => sum + entry.total_samples, 0)

      return { model, avgScore, totalSamples, entries: modelEntries }
    }).filter(model => model.totalSamples >= 15)
      .sort((a, b) => b.avgScore - a.avgScore)

    const samplerGroups = new Map<string, { scores: number[], totalSamples: number }>()

    const filteredData = data.filter(entry => {
      const modelName = entry.model_name || ''
      const modelEntries = data.filter(e => e.model_name === modelName)
      const totalSamples = modelEntries.reduce((sum, e) => sum + e.total_samples, 0)
      return totalSamples >= 15
    })

    filteredData.forEach(entry => {
      let samplerName = entry.sampler_name
      const match = samplerName.match(/^([^(]+)(?:\s*\([^)]+\))?/)
      if (match) samplerName = match[1].trim()

      if (!samplerGroups.has(samplerName)) {
        samplerGroups.set(samplerName, { scores: [], totalSamples: 0 })
      }

      const group = samplerGroups.get(samplerName)!
      group.scores.push(entry.average_score)
      group.totalSamples += entry.total_samples
    })

    const samplerPerformance = Array.from(samplerGroups.entries())
      .map(([name, data]) => ({
        name,
        avgScore: data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length,
        totalSamples: data.totalSamples
      }))
      .sort((a, b) => b.avgScore - a.avgScore)

    const consensusStrengths = filteredData
      .filter(entry => entry.avg_consensus_strength != null)
      .map(entry => entry.avg_consensus_strength!)

    const avgConsensus = consensusStrengths.length > 0
      ? consensusStrengths.reduce((sum, val) => sum + val, 0) / consensusStrengths.length
      : 0

    return { modelPerformance, samplerPerformance, avgConsensus }
  }, [data])

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="container py-6 md:py-10">
          <Navigation />
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !data || !insights) {
    return (
      <div className="min-h-screen">
        <div className="container py-6 md:py-10">
          <Navigation />
          <GlassPanel variant="subtle" className="text-center py-12 mt-8">
            <AlertTriangle className="w-8 h-8 text-accent mx-auto mb-4" />
            <p className="text-fg-muted">Unable to load benchmark data</p>
          </GlassPanel>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-6 md:py-10">
        <ProbabilityBackdrop variant="subtle" className="opacity-40" />

        <div className="container relative z-10">
          <Navigation />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <Badge variant="accent" className="mb-4">Research Findings</Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl text-fg mb-4">
              Key Insights
            </h1>
            <p className="text-lg md:text-xl text-fg-muted leading-relaxed">
              Analysis of {summary?.total_samples || data.reduce((sum, entry) => sum + entry.total_samples, 0)} samples
              across {insights.modelPerformance.length} models reveals how different sampling strategies
              affect output quality.
            </p>
          </motion.div>
        </div>
      </section>

      <CurveDivider className="opacity-30" />

      {/* Executive Summary */}
      <section className="py-12 md:py-16">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6 mb-12"
          >
            <GlassPanel variant="accent" className="text-center py-8">
              <BarChart3 className="w-8 h-8 text-accent mx-auto mb-3" />
              <p className="text-4xl font-display text-fg mb-1">
                {insights.modelPerformance.length}
              </p>
              <p className="text-sm text-fg-muted">Models Evaluated</p>
            </GlassPanel>

            <GlassPanel variant="default" className="text-center py-8">
              <TrendingUp className="w-8 h-8 text-accent mx-auto mb-3" />
              <p className="text-4xl font-display text-fg mb-1">
                {insights.modelPerformance[0]?.avgScore.toFixed(2) || 'N/A'}
              </p>
              <p className="text-sm text-fg-muted">Top Score /10</p>
            </GlassPanel>

            <GlassPanel variant="default" className="text-center py-8">
              <Users className="w-8 h-8 text-accent mx-auto mb-3" />
              <p className="text-4xl font-display text-fg mb-1">
                {(insights.avgConsensus * 100).toFixed(0)}%
              </p>
              <p className="text-sm text-fg-muted">Judge Consensus</p>
            </GlassPanel>
          </motion.div>
        </div>
      </section>

      {/* Model Performance */}
      <section className="py-12 md:py-16 border-t border-border-subtle">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Brain className="w-6 h-6 text-accent" />
              <h2 className="text-2xl md:text-3xl text-fg">Model Performance</h2>
            </div>

            {insights.modelPerformance.length > 0 && (
              <Card variant="accent" glow className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RankBadge rank={1} />
                    Top Performer: {insights.modelPerformance[0].model}
                  </CardTitle>
                  <CardDescription>
                    Achieved the highest average score across all samplers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-fg-muted mb-1">Overall Score</p>
                      <p className="text-4xl font-display text-fg">
                        {insights.modelPerformance[0].avgScore.toFixed(3)}
                        <span className="text-lg text-fg-muted">/10</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-fg-muted mb-1">Samples Evaluated</p>
                      <p className="text-4xl font-display text-fg">
                        {insights.modelPerformance[0].totalSamples}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Full Rankings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.modelPerformance.map((model, index) => (
                    <motion.div
                      key={model.model}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 p-4 rounded-xl bg-surface-elevated/50 border border-border-subtle"
                    >
                      <RankBadge rank={index + 1} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-fg truncate">{model.model}</p>
                        <p className="text-sm text-fg-muted">{model.totalSamples} samples</p>
                      </div>
                      <p className="text-xl font-mono font-medium text-accent">
                        {model.avgScore.toFixed(3)}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Sampler Analysis */}
      <section className="py-12 md:py-16 border-t border-border-subtle">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-6 h-6 text-accent" />
              <h2 className="text-2xl md:text-3xl text-fg">Sampling Strategy Impact</h2>
            </div>

            <div className="prose max-w-none mb-8">
              <p className="text-fg-muted text-lg">
                {insights.samplerPerformance.length > 1 ? (
                  (insights.samplerPerformance[0].avgScore - insights.samplerPerformance[insights.samplerPerformance.length - 1].avgScore) < 0.5
                    ? `Across all evaluated samples, different sampling strategies show surprisingly small performance differences (${(insights.samplerPerformance[0].avgScore - insights.samplerPerformance[insights.samplerPerformance.length - 1].avgScore).toFixed(3)} point range). This suggests that for creative writing tasks, the choice of sampler has limited impact on overall quality.`
                    : `Analysis reveals meaningful differences between sampling strategies (${(insights.samplerPerformance[0].avgScore - insights.samplerPerformance[insights.samplerPerformance.length - 1].avgScore).toFixed(3)} point range). The choice of sampler can meaningfully affect output quality.`
                ) : 'Single sampling strategy evaluated.'}
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Strategy Rankings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.samplerPerformance.map((sampler, index) => (
                    <motion.div
                      key={sampler.name}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 p-4 rounded-xl bg-surface-elevated/50 border border-border-subtle"
                    >
                      <Badge variant={index === 0 ? 'default' : 'outline'}>
                        #{index + 1}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-fg truncate">{sampler.name}</p>
                        <p className="text-sm text-fg-muted">{sampler.totalSamples} samples</p>
                      </div>
                      <p className="text-xl font-mono font-medium text-accent">
                        {sampler.avgScore.toFixed(3)}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* MMLU Section */}
      {!mmlu.loading && !mmlu.error && mmlu.data && mmlu.data.length > 0 && (
        <section className="py-12 md:py-16 border-t border-border-subtle">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle className="w-6 h-6 text-accent" />
                <h2 className="text-2xl md:text-3xl text-fg">MMLU-Pro Accuracy</h2>
              </div>

              <div className="prose max-w-none mb-8">
                <p className="text-fg-muted text-lg">
                  Objective accuracy testing on MMLU-Pro subset reveals how samplers affect factual correctness.
                </p>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mmlu.data.slice(0, 6).map((entry, index) => (
                      <motion.div
                        key={`${entry.model_name}-${entry.sampler_name}`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 rounded-xl bg-surface-elevated/50 border border-border-subtle"
                      >
                        <p className="font-medium text-fg truncate mb-1">{entry.model_name}</p>
                        <p className="text-sm text-fg-muted truncate mb-3">{entry.sampler_name}</p>
                        <p className="text-2xl font-mono font-medium text-accent">
                          {(entry.average_score * 100).toFixed(1)}%
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 border-t border-border-subtle">
        <div className="container text-center text-sm text-fg-subtle">
          <p>Data refreshes on each benchmark run</p>
          {summary?.last_updated && (
            <p className="mt-1">Last updated: {new Date(summary.last_updated).toLocaleString()}</p>
          )}
        </div>
      </footer>
    </div>
  )
}

export default function FindingsPage() {
  return (
    <MmluProvider>
      <FindingsContent />
    </MmluProvider>
  )
}
