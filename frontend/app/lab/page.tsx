"use client"

import { useState } from 'react'
import { motion } from 'motion/react'
import { Navigation } from "@/components/navigation"
import { GlassPanel } from "@/components/observatory/glass-panel"
import { SamplerPills, SamplerDisplay, SAMPLERS } from "@/components/observatory/sampler-selector"
import { ProbabilityDistributionChart } from "@/components/probability-distribution-chart"
import { SamplerExplanation } from "@/components/sampler-explanation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { ChevronDown, ChevronUp, RotateCcw, BookOpen } from "lucide-react"

export default function Lab() {
  const defaultValues = {
    temperature: 1.0,
    topP: 0.9,
    topK: 20,
    minP: 0.1,
    topNSigma: 3.0
  }

  const [selectedSampler, setSelectedSampler] = useState<string>('temperature')
  const [temperature, setTemperature] = useState([defaultValues.temperature])
  const [topP, setTopP] = useState([defaultValues.topP])
  const [topK, setTopK] = useState([defaultValues.topK])
  const [minP, setMinP] = useState([defaultValues.minP])
  const [topNSigma, setTopNSigma] = useState([defaultValues.topNSigma])
  const [showExplanation, setShowExplanation] = useState(false)
  const [showMath, setShowMath] = useState(false)

  const resetParameters = () => {
    setTemperature([defaultValues.temperature])
    setTopP([defaultValues.topP])
    setTopK([defaultValues.topK])
    setMinP([defaultValues.minP])
    setTopNSigma([defaultValues.topNSigma])
  }

  const getParameters = (): Record<string, number> => {
    const baseParams: Record<string, number> = { temperature: temperature[0] }

    switch (selectedSampler) {
      case 'top_p':
        return { ...baseParams, top_p: topP[0] }
      case 'top_k':
        return { ...baseParams, top_k: topK[0] }
      case 'min_p':
        return { ...baseParams, min_p: minP[0] }
      case 'top_n_sigma':
        return { ...baseParams, n_sigma: topNSigma[0] }
      default:
        return baseParams
    }
  }

  const currentSampler = SAMPLERS.find(s => s.id === selectedSampler)

  return (
    <div className="min-h-screen relative">
      {/* Navigation */}
      <Navigation />

      {/* Full Viewport Visualization */}
      <div className={`pt-20 px-4 ${
        selectedSampler === 'temperature' ? 'pb-48 md:pb-52' : 'pb-64 md:pb-72'
      }`}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl text-fg mb-2">The Lab</h1>
          <p className="text-fg-muted">Explore how sampling strategies shape token selection</p>
        </motion.div>

        {/* Sampler Selection */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6 -mx-4 px-4 overflow-x-auto"
        >
          <SamplerPills
            selected={selectedSampler}
            onSelect={setSelectedSampler}
            className="justify-center min-w-max"
          />
        </motion.div>

        {/* Main Visualization Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <GlassPanel variant="elevated" className="flex flex-col">
            {/* Chart Header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <SamplerDisplay samplerId={selectedSampler} showDescription={false} />

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="gap-1"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">Learn</span>
                  {showExplanation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Explanation Panel (Collapsible) */}
            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-4 bg-surface rounded-xl border border-border-subtle overflow-hidden"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-fg">
                    How {currentSampler?.name} Works
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMath(!showMath)}
                  >
                    {showMath ? 'Hide' : 'Show'} Math
                  </Button>
                </div>
                <SamplerExplanation sampler={selectedSampler} showMath={showMath} />
              </motion.div>
            )}

            {/* Probability Distribution Chart */}
            <ProbabilityDistributionChart
              sampler={selectedSampler}
              parameters={getParameters()}
            />
          </GlassPanel>
        </motion.div>
      </div>

      {/* Floating Control Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4"
      >
        <div className="container max-w-3xl mx-auto">
          <GlassPanel variant="elevated" size="md" className="shadow-elevated">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-fg">Parameters</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetParameters}
                className="gap-1 text-fg-muted hover:text-fg"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
            </div>

            <div className="space-y-5">
              {/* Temperature (always shown) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-fg">Temperature</label>
                  <Badge variant="outline" size="sm">{temperature[0].toFixed(1)}</Badge>
                </div>
                <Slider
                  value={temperature}
                  onValueChange={setTemperature}
                  min={0.1}
                  max={3.0}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-fg-subtle">
                  Controls randomness. Lower = focused, higher = random.
                </p>
              </div>

              {/* Sampler-specific parameters */}
              {selectedSampler === 'top_p' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-fg">Top-p (Nucleus)</label>
                    <Badge variant="outline" size="sm">{topP[0].toFixed(2)}</Badge>
                  </div>
                  <Slider
                    value={topP}
                    onValueChange={setTopP}
                    min={0.1}
                    max={1.0}
                    step={0.05}
                    className="w-full"
                  />
                  <p className="text-xs text-fg-subtle">
                    Cumulative probability threshold (0.9 = top 90% probability mass)
                  </p>
                </div>
              )}

              {selectedSampler === 'top_k' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-fg">Top-k</label>
                    <Badge variant="outline" size="sm">{topK[0]}</Badge>
                  </div>
                  <Slider
                    value={topK}
                    onValueChange={setTopK}
                    min={1}
                    max={20}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-fg-subtle">
                    Number of top tokens to consider
                  </p>
                </div>
              )}

              {selectedSampler === 'min_p' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-fg">Min-p</label>
                    <Badge variant="outline" size="sm">{minP[0].toFixed(2)}</Badge>
                  </div>
                  <Slider
                    value={minP}
                    onValueChange={setMinP}
                    min={0.01}
                    max={0.5}
                    step={0.01}
                    className="w-full"
                  />
                  <p className="text-xs text-fg-subtle">
                    Minimum probability relative to top token
                  </p>
                </div>
              )}

              {selectedSampler === 'top_n_sigma' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-fg">n-sigma (σ)</label>
                    <Badge variant="outline" size="sm">{topNSigma[0].toFixed(1)}</Badge>
                  </div>
                  <Slider
                    value={topNSigma}
                    onValueChange={setTopNSigma}
                    min={1.0}
                    max={5.0}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-fg-subtle">
                    Standard deviation threshold for logit filtering
                  </p>
                </div>
              )}
            </div>
          </GlassPanel>
        </div>
      </motion.div>
    </div>
  )
}
