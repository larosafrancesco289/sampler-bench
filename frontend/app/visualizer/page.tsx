"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Navigation } from "@/components/navigation"
import { BookOpen, Settings, BarChart3 } from "lucide-react"
import { ProbabilityDistributionChart } from "@/components/probability-distribution-chart"
import { SamplerExplanation } from "@/components/sampler-explanation"

export default function SamplerVisualizer() {
  const defaultValues = {
    temperature: 1.0,
    topP: 0.9,
    topK: 50,
    minP: 0.1,
    topNSigma: 3.0
  }

  const [selectedSampler, setSelectedSampler] = useState<string>('temperature')
  const [temperature, setTemperature] = useState([defaultValues.temperature])
  const [topP, setTopP] = useState([defaultValues.topP])
  const [topK, setTopK] = useState([defaultValues.topK])
  const [minP, setMinP] = useState([defaultValues.minP])
  const [topNSigma, setTopNSigma] = useState([defaultValues.topNSigma])
  const [showMath, setShowMath] = useState(false)

  const resetParameters = () => {
    setTemperature([defaultValues.temperature])
    setTopP([defaultValues.topP])
    setTopK([defaultValues.topK])
    setMinP([defaultValues.minP])
    setTopNSigma([defaultValues.topNSigma])
  }

  const samplers = [
    { id: 'temperature', name: 'Temperature', description: 'Controls randomness by scaling logits' },
    { id: 'top_p', name: 'Top-p (Nucleus)', description: 'Selects tokens with cumulative probability up to p' },
    { id: 'top_k', name: 'Top-k', description: 'Selects top k most likely tokens' },
    { id: 'min_p', name: 'Min-p', description: 'Dynamic threshold based on top token probability' },
    { id: 'top_n_sigma', name: 'Top-nσ', description: 'Statistical threshold using standard deviation' }
  ]

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

  return (
    <div className="container mx-auto py-8 px-4">
      <Navigation />
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Sampler Visualizer
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Interactive visualization of LLM sampling strategies and their effects on token selection
        </p>
      </div>

      {/* Sampler Selection */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Select Sampling Strategy
            </CardTitle>
            <CardDescription>
              Choose a sampling method to visualize its behavior
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {samplers.map((sampler) => (
                <Button
                  key={sampler.id}
                  variant={selectedSampler === sampler.id ? "default" : "outline"}
                  className="h-auto p-4 text-left flex-col items-start justify-start min-h-[100px]"
                  onClick={() => setSelectedSampler(sampler.id)}
                >
                  <div className="w-full">
                    <div className="font-semibold text-left mb-2 break-words">{sampler.name}</div>
                    <div className="text-sm opacity-70 text-left break-words hyphens-auto leading-relaxed">
                      {sampler.description}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Parameters Control */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Parameters
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={resetParameters}
                className="text-xs"
              >
                Reset to Defaults
              </Button>
            </CardTitle>
            <CardDescription>
              Adjust the parameters to see their effect on the probability distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Temperature (always shown) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Temperature</label>
                  <Badge variant="outline">{temperature[0]}</Badge>
                </div>
                <Slider
                  value={temperature}
                  onValueChange={setTemperature}
                  min={0.1}
                  max={3.0}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Controls randomness. Lower values = more focused, higher values = more random. Default: 1.0
                </p>
              </div>

              {/* Sampler-specific parameters */}
              {selectedSampler === 'top_p' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Top-p (Nucleus)</label>
                    <Badge variant="outline">{topP[0]}</Badge>
                  </div>
                  <Slider
                    value={topP}
                    onValueChange={setTopP}
                    min={0.1}
                    max={1.0}
                    step={0.05}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Cumulative probability threshold. Tokens with cumulative probability below this are filtered out. Default: 0.9
                  </p>
                </div>
              )}

              {selectedSampler === 'top_k' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Top-k</label>
                    <Badge variant="outline">{topK[0]}</Badge>
                  </div>
                  <Slider
                    value={topK}
                    onValueChange={setTopK}
                    min={1}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Number of top tokens to consider. Only the k most likely tokens are kept. Default: 50
                  </p>
                </div>
              )}

              {selectedSampler === 'min_p' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Min-p</label>
                    <Badge variant="outline">{minP[0]}</Badge>
                  </div>
                  <Slider
                    value={minP}
                    onValueChange={setMinP}
                    min={0.01}
                    max={0.5}
                    step={0.01}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Minimum probability threshold scaled by top token probability. Default: 0.1
                  </p>
                </div>
              )}

              {selectedSampler === 'top_n_sigma' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">n-sigma</label>
                    <Badge variant="outline">{topNSigma[0]}</Badge>
                  </div>
                  <Slider
                    value={topNSigma}
                    onValueChange={setTopNSigma}
                    min={1.0}
                    max={5.0}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Standard deviation multiplier for logit threshold. Default: 3.0
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Explanation and Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Explanation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                {samplers.find(s => s.id === selectedSampler)?.name} Sampling
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMath(!showMath)}
              >
                {showMath ? 'Hide' : 'Show'} Math
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SamplerExplanation sampler={selectedSampler} showMath={showMath} />
          </CardContent>
        </Card>

        {/* Visualization */}
        <Card>
          <CardHeader>
            <CardTitle>Probability Distribution</CardTitle>
            <CardDescription>
              How the sampling strategy affects token selection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProbabilityDistributionChart
              sampler={selectedSampler}
              parameters={getParameters()}
            />
          </CardContent>
        </Card>
      </div>

      {/* Usage Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">For Creative Writing:</h4>
              <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                <li>• Use higher temperature (1.2-2.0) for more creativity</li>
                <li>• Min-p sampling works well at high temperatures</li>
                <li>• Top-nσ maintains coherence even at high temps</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">For Factual Content:</h4>
              <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                <li>• Use lower temperature (0.7-1.0) for accuracy</li>
                <li>• Top-p with 0.9-0.95 works well</li>
                <li>• Top-k with 40-60 tokens for balance</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}