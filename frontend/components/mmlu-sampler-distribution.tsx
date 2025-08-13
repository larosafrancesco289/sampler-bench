"use client"

import { useMemo } from 'react'
import { ResponsiveContainer, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Bar, Scatter, Cell, LabelList } from 'recharts'
import { useMmluContext } from '@/contexts/mmlu-context'

type DistributionPoint = { sampler: string; model: string; accuracy: number }
type DistributionBar = { sampler: string; meanAccuracy: number }

const MODEL_COLORS = [
  'var(--color-accent)',
  'var(--color-accent-2)',
  'color-mix(in oklab, var(--color-accent) 70%, white)',
  'color-mix(in oklab, var(--color-accent-2) 70%, white)',
  'color-mix(in oklab, var(--color-accent) 50%, white)',
  'color-mix(in oklab, var(--color-accent-2) 50%, white)'
]

export function MmluSamplerDistribution() {
  const { data } = useMmluContext()

  const { bars, points, models } = useMemo(() => {
    // Group entries by actual sampler name
    const samplerGroups = new Map<string, { totalWeighted: number; weight: number; perModel: Map<string, number> }>()

    data.forEach((entry) => {
      let actualSampler = entry.sampler_name
      const match = entry.sampler_name.match(/^([^(]+)(?:\s*\([^)]+\))?/)
      if (match) {
        actualSampler = match[1].trim()
      }
      const model = entry.model_name || 'Unknown Model'
      const accuracy = Number(entry.average_score) * 100
      const weight = entry.total_samples || 1

      if (!samplerGroups.has(actualSampler)) {
        samplerGroups.set(actualSampler, { totalWeighted: 0, weight: 0, perModel: new Map<string, number>() })
      }
      const group = samplerGroups.get(actualSampler)!
      group.totalWeighted += accuracy * weight
      group.weight += weight
      group.perModel.set(model, accuracy)
    })

    // Build bars (mean accuracy per sampler) and points (per model accuracy)
    const bars: DistributionBar[] = []
    const points: DistributionPoint[] = []
    const modelSet = new Set<string>()

    Array.from(samplerGroups.entries()).forEach(([sampler, group]) => {
      const meanAccuracy = group.weight > 0 ? group.totalWeighted / group.weight : 0
      bars.push({ sampler, meanAccuracy })
      group.perModel.forEach((acc, model) => {
        points.push({ sampler, model, accuracy: acc })
        modelSet.add(model)
      })
    })

    // Sort by mean accuracy desc for nicer ordering, and remove model suffix from sampler label duplicates
    bars.sort((a, b) => b.meanAccuracy - a.meanAccuracy)
    const order = new Map<string, number>(bars.map((b, idx) => [b.sampler, idx]))
    points.sort((a, b) => (order.get(a.sampler)! - order.get(b.sampler)!))

    return { bars, points, models: Array.from(modelSet) }
  }, [data])

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-fg-muted">
        No MMLU data available
      </div>
    )
  }

  // Map model name to color
  const colorOf = (model: string) => {
    const idx = models.indexOf(model)
    return MODEL_COLORS[idx % MODEL_COLORS.length]
  }

  return (
    <div className="h-72 sm:h-96">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={bars} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
          <XAxis dataKey="sampler" angle={-45} textAnchor="end" height={70} tick={{ fontSize: 10, fill: 'currentColor' }} stroke="currentColor" opacity={0.7} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'currentColor' }} stroke="currentColor" opacity={0.7} />
          <Tooltip formatter={(value: number, name: string) => [name === 'meanAccuracy' ? `${value.toFixed(1)}%` : `${value.toFixed(1)}%`, name === 'meanAccuracy' ? 'Mean Accuracy' : 'Accuracy']} contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-fg)' }} />
          <Legend />
          <Bar dataKey="meanAccuracy" name="Mean Accuracy" fill="color-mix(in oklab, var(--color-accent) 60%, white)" stroke="var(--color-border)" strokeWidth={0.6} radius={[4, 4, 0, 0]}>
            <LabelList dataKey="meanAccuracy" formatter={(v: number) => `${v.toFixed(1)}%`} position="top" className="text-[10px] fill-current" />
          </Bar>
          {/* Overlay per-model points */}
          {models.map((model) => {
            const modelPoints = points.filter(p => p.model === model).map(p => ({ ...p, x: p.sampler, y: p.accuracy }))
            return (
              <Scatter key={model} name={model} data={modelPoints} xAxisId={0} yAxisId={0} fill={colorOf(model)}>
                {modelPoints.map((p, idx) => (
                  <Cell key={`${model}-${idx}`} fill={colorOf(model)} />
                ))}
              </Scatter>
            )
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}


