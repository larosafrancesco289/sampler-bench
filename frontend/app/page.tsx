"use client"

import { useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Navigation } from "@/components/navigation"
import { ProbabilityBackdrop } from "@/components/observatory/probability-backdrop"
import { GlassPanel, StatPanel } from "@/components/observatory/glass-panel"
import { Button } from "@/components/ui/button"
import { Badge, RankBadge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useBenchmarkContext } from "@/contexts/benchmark-context"
import { ArrowRight, FlaskConical, Trophy, ChevronDown, Sparkles, TrendingUp } from "lucide-react"

export default function Observatory() {
  const { data, loading, error } = useBenchmarkContext()

  // Get top 5 samplers aggregated across models
  const topSamplers = useMemo(() => {
    if (!data || data.length === 0) return null

    // Group by sampler name (without model suffix)
    const samplerGroups = new Map<string, {
      totalScore: number
      totalSamples: number
      modelCount: number
      entries: typeof data
    }>()

    data.forEach(entry => {
      // Parse actual sampler name (remove model suffix if present)
      let samplerName = entry.sampler_name
      const match = entry.sampler_name.match(/^([^(]+)(?:\s*\([^)]+\))?/)
      if (match) {
        samplerName = match[1].trim()
      }

      if (!samplerGroups.has(samplerName)) {
        samplerGroups.set(samplerName, {
          totalScore: 0,
          totalSamples: 0,
          modelCount: 0,
          entries: []
        })
      }

      const group = samplerGroups.get(samplerName)!
      group.totalScore += entry.average_score * entry.total_samples
      group.totalSamples += entry.total_samples
      group.modelCount += 1
      group.entries.push(entry)
    })

    // Convert to array with aggregated scores
    const aggregated = Array.from(samplerGroups.entries()).map(([name, group]) => ({
      sampler_name: name,
      average_score: group.totalScore / group.totalSamples,
      total_samples: group.totalSamples,
      model_count: group.modelCount
    }))

    // Sort by score and return top 5
    return aggregated.sort((a, b) => b.average_score - a.average_score).slice(0, 5)
  }, [data])

  // Overall stats
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null

    const allScores = data.map(e => e.average_score)
    const avgScore = allScores.reduce((a, b) => a + b, 0) / allScores.length
    const topScore = Math.max(...allScores)
    const totalSamples = data.reduce((sum, e) => sum + e.total_samples, 0)
    const uniqueModels = new Set(data.map(e => e.model_name)).size

    return { avgScore, topScore, totalSamples, uniqueModels }
  }, [data])

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex flex-col">
        {/* Probability Backdrop */}
        <ProbabilityBackdrop variant="hero" className="opacity-60" />

        <div className="container relative z-10 flex-1 flex flex-col">
          <Navigation />

          {/* Hero Content */}
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12 md:py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-4xl mx-auto"
            >
              {/* Tagline */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mb-6"
              >
                <Badge variant="accent" size="lg" className="gap-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  The Sampling Observatory
                </Badge>
              </motion.div>

              {/* Main Headline */}
              <h1 className="text-fg mb-6">
                <span className="block">Explore How</span>
                <span className="text-gradient">Sampling Shapes Output</span>
              </h1>

              <p className="text-lg md:text-xl text-fg-muted max-w-2xl mx-auto mb-10 leading-relaxed">
                Discover which sampling strategies produce the highest quality text across
                creative writing and objective accuracy benchmarks.
              </p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Link href="/lab">
                  <Button size="lg" className="gap-2 min-w-[180px]">
                    <FlaskConical className="w-5 h-5" />
                    Try The Lab
                  </Button>
                </Link>
                <Link href="/leaderboard">
                  <Button variant="outline" size="lg" className="gap-2 min-w-[180px]">
                    <Trophy className="w-5 h-5" />
                    View Leaderboard
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Quick Stats */}
            {stats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
              >
                <StatPanel
                  label="Models Tested"
                  value={stats.uniqueModels}
                  icon={<Sparkles className="w-4 h-4" />}
                />
                <StatPanel
                  label="Samples"
                  value={stats.totalSamples.toLocaleString()}
                />
                <StatPanel
                  label="Avg Score"
                  value={stats.avgScore.toFixed(2)}
                  subValue="/10"
                />
                <StatPanel
                  label="Top Score"
                  value={stats.topScore.toFixed(2)}
                  subValue="/10"
                  icon={<TrendingUp className="w-4 h-4" />}
                />
              </motion.div>
            )}
          </div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="flex flex-col items-center pb-8 text-fg-subtle"
          >
            <span className="text-xs uppercase tracking-widest mb-2">Explore Samplers</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Top Samplers Section */}
      <section className="py-16 md:py-24 border-t border-border-subtle">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl text-fg mb-4">
              Top Sampling Strategies
            </h2>
            <p className="text-fg-muted max-w-xl mx-auto">
              The highest scoring sampler configurations aggregated across all tested models
            </p>
          </motion.div>

          {/* Results */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <GlassPanel variant="subtle" className="text-center py-12 max-w-lg mx-auto">
              <p className="text-fg-muted">Unable to load benchmark data</p>
            </GlassPanel>
          ) : topSamplers && topSamplers.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="max-w-3xl mx-auto"
            >
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {topSamplers.map((entry, index) => (
                      <motion.div
                        key={entry.sampler_name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-4 p-4 rounded-xl bg-surface-elevated/50 border border-border-subtle hover:border-border transition-colors"
                      >
                        <RankBadge rank={index + 1} />

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-fg truncate">
                            {entry.sampler_name}
                          </p>
                          <p className="text-sm text-fg-muted">
                            Tested on {entry.model_count} model{entry.model_count > 1 ? 's' : ''}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xl font-mono font-medium text-accent">
                            {entry.average_score.toFixed(2)}
                          </p>
                          <p className="text-xs text-fg-subtle">
                            {entry.total_samples} samples
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-border-subtle">
                    <Link href="/leaderboard">
                      <Button variant="ghost" className="w-full gap-2">
                        View Full Leaderboard
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <GlassPanel variant="subtle" className="text-center py-12 max-w-lg mx-auto">
              <p className="text-fg-muted">No benchmark data available</p>
            </GlassPanel>
          )}
        </div>
      </section>

      {/* Quick Access Section */}
      <section className="py-16 md:py-24 border-t border-border-subtle">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/lab" className="group">
              <Card hover className="h-full">
                <CardContent className="p-8 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-accent-muted flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <FlaskConical className="w-7 h-7 text-accent" />
                  </div>
                  <h3 className="text-xl font-display text-fg mb-2">The Lab</h3>
                  <p className="text-sm text-fg-muted">
                    Interactive sampler visualization with real logits data
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/leaderboard" className="group">
              <Card hover className="h-full">
                <CardContent className="p-8 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-accent-2-muted flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Trophy className="w-7 h-7 text-accent-2" />
                  </div>
                  <h3 className="text-xl font-display text-fg mb-2">Leaderboard</h3>
                  <p className="text-sm text-fg-muted">
                    Rankings for creative writing and MMLU accuracy
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/findings" className="group">
              <Card hover className="h-full">
                <CardContent className="p-8 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-surface-elevated flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="w-7 h-7 text-fg" />
                  </div>
                  <h3 className="text-xl font-display text-fg mb-2">Findings</h3>
                  <p className="text-sm text-fg-muted">
                    Key insights and analysis from benchmark results
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border-subtle">
        <div className="container text-center text-sm text-fg-subtle">
          <p>
            Built with precision for the ML community
          </p>
        </div>
      </footer>
    </div>
  )
}
