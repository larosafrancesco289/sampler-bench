"use client"

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useMmluContext } from '@/contexts/mmlu-context'

type HistogramMode = 'overall' | 'byModel'

interface MmluHistogramProps {
  mode?: HistogramMode
}

const COLORS = [
  'var(--color-accent)',
  'var(--color-accent-2)',
  'color-mix(in oklab, var(--color-accent) 70%, white)',
  'color-mix(in oklab, var(--color-accent-2) 70%, white)'
]

export function MmluHistogram({ mode = 'overall' }: MmluHistogramProps) {
  const { data } = useMmluContext()

  // Build histogram buckets (0-100% in 5% bins)
  const histogramData = useMemo(() => {
    const binSize = 5
    const bins: { range: string; count: number }[] = []
    for (let start = 0; start < 100; start += binSize) {
      bins.push({ range: `${start}-${start + binSize}%`, count: 0 })
    }

    data.forEach((entry) => {
      const pct = Math.max(0, Math.min(99.999, entry.average_score * 100))
      const binIndex = Math.floor(pct / binSize)
      bins[binIndex].count += 1
    })

    return bins
  }, [data])

  // Group by model to show per-model histograms
  const perModel = useMemo(() => {
    const groups: Record<string, typeof data> = {}
    data.forEach((e) => {
      const model = e.model_name || 'Unknown Model'
      if (!groups[model]) groups[model] = []
      groups[model].push(e)
    })
    const binSize = 5
    const charts = Object.entries(groups).map(([model, entries]) => {
      const bins: { range: string; count: number }[] = []
      for (let start = 0; start < 100; start += binSize) {
        bins.push({ range: `${start}-${start + binSize}%`, count: 0 })
      }
      entries.forEach((entry) => {
        const pct = Math.max(0, Math.min(99.999, entry.average_score * 100))
        bins[Math.floor(pct / binSize)].count += 1
      })
      return { model, bins }
    })
    return charts
  }, [data])

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-fg-muted">
        No MMLU data available
      </div>
    )
  }

  if (mode === 'byModel') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {perModel.map(({ model, bins }) => (
          <div key={model}>
            <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-fg break-words">{model}</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bins} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                  <XAxis dataKey="range" angle={-45} textAnchor="end" height={50} tick={{ fontSize: 10, fill: 'currentColor' }} stroke="currentColor" opacity={0.7} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'currentColor' }} stroke="currentColor" opacity={0.7} />
                  <Tooltip formatter={(value: number) => [value, 'count']} contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-fg)' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {bins.map((_, idx: number) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} stroke="var(--color-border)" strokeWidth={0.6} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="h-64 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={histogramData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
          <XAxis dataKey="range" angle={-45} textAnchor="end" height={60} tick={{ fontSize: 10, fill: 'currentColor' }} stroke="currentColor" opacity={0.7} />
          <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'currentColor' }} stroke="currentColor" opacity={0.7} />
          <Tooltip formatter={(value: number) => [value, 'count']} contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-fg)' }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {histogramData.map((_, idx: number) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} stroke="var(--color-border)" strokeWidth={0.6} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}


