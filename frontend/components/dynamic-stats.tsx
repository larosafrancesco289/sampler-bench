"use client"

import { useBenchmarkContext } from "@/contexts/benchmark-context"
import { FileText, Layers, Star, Cpu } from "lucide-react"

const stats = [
  { key: 'total_samples', label: 'Total Samples', desc: 'Writing samples evaluated', icon: FileText },
  { key: 'unique_samplers', label: 'Strategies', desc: 'Sampling methods compared', icon: Layers },
  { key: 'avg_quality_score', label: 'Avg Quality', desc: 'Mean score (1-10)', icon: Star, format: (v: number) => v.toFixed(2) },
  { key: 'models_tested', label: 'Models', desc: 'LLMs in benchmark', icon: Cpu },
]

export function DynamicStats() {
  const { summary, loading, error } = useBenchmarkContext()

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="relative p-5 rounded-xl bg-surface border border-border overflow-hidden"
          >
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-20" />
              <div className="h-8 bg-muted rounded w-16" />
              <div className="h-3 bg-muted rounded w-24" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="p-5 rounded-xl bg-surface border border-border mb-8">
        <p className="text-sm text-fg-muted">Unable to load statistics</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        const value = summary[stat.key as keyof typeof summary]
        const displayValue = stat.format ? stat.format(value as number) : value

        return (
          <div
            key={stat.key}
            className="group relative p-5 rounded-xl bg-surface border border-border hover:border-[var(--color-accent)]/30 transition-all duration-300 hover:shadow-[var(--shadow-elevated)] overflow-hidden"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {/* Subtle gradient on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-md bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-fg-muted">{stat.label}</span>
              </div>

              <div className="text-3xl sm:text-4xl font-display font-semibold text-fg tracking-tight mb-1 transition-transform duration-300 group-hover:translate-x-0.5">
                {displayValue}
              </div>

              <p className="text-xs text-fg-muted/70">{stat.desc}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
} 