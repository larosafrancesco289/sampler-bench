"use client"

import { useMemo } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList } from 'recharts'
import { useMmluContext } from '@/contexts/mmlu-context'

export function MmluSamplerMeanChart() {
  const { data } = useMmluContext()

  const chartData = useMemo(() => {
    const samplerGroups = new Map<string, { totalWeighted: number; weight: number }>()
    data.forEach((entry: any) => {
      let sampler = entry.sampler_name
      const match = sampler.match(/^([^(]+)(?:\s*\([^)]+\))?/)
      if (match) sampler = match[1].trim()
      const acc = Number(entry.average_score) * 100
      const w = entry.total_samples || 1
      if (!samplerGroups.has(sampler)) samplerGroups.set(sampler, { totalWeighted: 0, weight: 0 })
      const g = samplerGroups.get(sampler)!
      g.totalWeighted += acc * w
      g.weight += w
    })
    const rows = Array.from(samplerGroups.entries()).map(([sampler, g]) => ({
      sampler,
      mean: g.weight ? g.totalWeighted / g.weight : 0
    }))
    rows.sort((a, b) => b.mean - a.mean)
    return rows
  }, [data])

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-fg-muted">
        No MMLU data available
      </div>
    )
  }

  const colors = [
    'var(--color-accent)',
    'var(--color-accent-2)',
    'color-mix(in oklab, var(--color-accent) 70%, white)',
    'color-mix(in oklab, var(--color-accent-2) 70%, white)'
  ]

  return (
    <div className="h-64 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
          <XAxis dataKey="sampler" angle={-45} textAnchor="end" height={60} tick={{ fontSize: 10, fill: 'currentColor' }} stroke="currentColor" opacity={0.7} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'currentColor' }} stroke="currentColor" opacity={0.7} />
          <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Mean Accuracy']} contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-fg)' }} />
          <Bar dataKey="mean" radius={[4, 4, 0, 0]}>
            {chartData.map((_, idx) => (
              <Cell key={idx} fill={colors[idx % colors.length]} stroke="var(--color-border)" strokeWidth={0.6} />
            ))}
            <LabelList dataKey="mean" formatter={(v: number) => `${v.toFixed(1)}%`} position="top" className="text-[10px] fill-current" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}


