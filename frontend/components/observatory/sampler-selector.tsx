"use client"

import { useState } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { Thermometer, Layers, Hash, Gauge, Activity } from 'lucide-react'

export interface Sampler {
  id: string
  name: string
  shortName: string
  description: string
  icon: React.ReactNode
  color: string
}

export const SAMPLERS: Sampler[] = [
  {
    id: 'temperature',
    name: 'Temperature',
    shortName: 'Temp',
    description: 'Controls randomness by scaling logits',
    icon: <Thermometer className="w-5 h-5" />,
    color: 'var(--color-accent)'
  },
  {
    id: 'top_p',
    name: 'Top-p (Nucleus)',
    shortName: 'Top-p',
    description: 'Cumulative probability threshold',
    icon: <Layers className="w-5 h-5" />,
    color: '#60A5FA'
  },
  {
    id: 'top_k',
    name: 'Top-k',
    shortName: 'Top-k',
    description: 'Fixed number of top tokens',
    icon: <Hash className="w-5 h-5" />,
    color: '#34D399'
  },
  {
    id: 'min_p',
    name: 'Min-p',
    shortName: 'Min-p',
    description: 'Dynamic relative threshold',
    icon: <Gauge className="w-5 h-5" />,
    color: '#F472B6'
  },
  {
    id: 'top_n_sigma',
    name: 'Top-nσ',
    shortName: 'nσ',
    description: 'Statistical deviation filter',
    icon: <Activity className="w-5 h-5" />,
    color: 'var(--color-accent-2)'
  }
]

interface SamplerSelectorProps {
  selected: string
  onSelect: (id: string) => void
  variant?: 'horizontal' | 'vertical' | 'grid'
  size?: 'sm' | 'md' | 'lg'
  showDescriptions?: boolean
  className?: string
}

export function SamplerSelector({
  selected,
  onSelect,
  variant = 'horizontal',
  size = 'md',
  showDescriptions = false,
  className
}: SamplerSelectorProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const containerStyles = cn(
    'flex gap-2',
    {
      'flex-row flex-wrap justify-center': variant === 'horizontal',
      'flex-col': variant === 'vertical',
      'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5': variant === 'grid',
    },
    className
  )

  const buttonStyles = (sampler: Sampler, isSelected: boolean) => cn(
    'relative flex items-center gap-3 rounded-xl transition-all duration-300',
    'border outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
    {
      // Size variants
      'px-3 py-2 text-sm': size === 'sm',
      'px-4 py-3': size === 'md',
      'px-5 py-4': size === 'lg',

      // Selected state
      'bg-accent-muted border-accent text-fg': isSelected,
      'bg-surface/50 border-border text-fg-muted hover:text-fg hover:border-border-accent hover:bg-surface': !isSelected,

      // Layout adjustments
      'flex-col text-center': variant === 'grid',
    }
  )

  return (
    <div className={containerStyles}>
      {SAMPLERS.map((sampler) => {
        const isSelected = selected === sampler.id

        return (
          <motion.button
            key={sampler.id}
            className={buttonStyles(sampler, isSelected)}
            onClick={() => onSelect(sampler.id)}
            onMouseEnter={() => setHoveredId(sampler.id)}
            onMouseLeave={() => setHoveredId(null)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            layout
          >
            {/* Glow effect when selected */}
            {isSelected && (
              <motion.div
                className="absolute inset-0 rounded-xl opacity-50"
                style={{
                  boxShadow: `0 0 20px ${sampler.color}40, inset 0 0 20px ${sampler.color}10`
                }}
                layoutId="sampler-glow"
                transition={{ duration: 0.3 }}
              />
            )}

            {/* Icon */}
            <span
              className="relative z-10 transition-colors duration-200"
              style={{ color: isSelected || hoveredId === sampler.id ? sampler.color : undefined }}
            >
              {sampler.icon}
            </span>

            {/* Text content */}
            <div className={cn(
              'relative z-10',
              variant === 'grid' ? 'text-center' : 'text-left'
            )}>
              <span className="font-medium block">
                {variant === 'grid' && size === 'sm' ? sampler.shortName : sampler.name}
              </span>

              {showDescriptions && (
                <span className="text-xs text-fg-subtle block mt-0.5">
                  {sampler.description}
                </span>
              )}
            </div>

            {/* Selection indicator */}
            {isSelected && variant !== 'grid' && (
              <motion.div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                style={{ backgroundColor: sampler.color }}
                layoutId="sampler-indicator"
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              />
            )}
          </motion.button>
        )
      })}
    </div>
  )
}

// Compact pill selector for mobile
export function SamplerPills({
  selected,
  onSelect,
  className
}: {
  selected: string
  onSelect: (id: string) => void
  className?: string
}) {
  return (
    <div className={cn('flex gap-1.5 overflow-x-auto scrollbar-hidden py-1', className)}>
      {SAMPLERS.map((sampler) => {
        const isSelected = selected === sampler.id

        return (
          <motion.button
            key={sampler.id}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap',
              'border transition-all duration-200',
              isSelected
                ? 'bg-accent text-black border-accent font-medium'
                : 'bg-surface/50 text-fg-muted border-border hover:border-accent hover:text-fg'
            )}
            onClick={() => onSelect(sampler.id)}
            whileTap={{ scale: 0.95 }}
          >
            <span className="w-4 h-4">{sampler.icon}</span>
            <span>{sampler.shortName}</span>
          </motion.button>
        )
      })}
    </div>
  )
}

// Single sampler display with details
export function SamplerDisplay({
  samplerId,
  showDescription = true,
  className
}: {
  samplerId: string
  showDescription?: boolean
  className?: string
}) {
  const sampler = SAMPLERS.find(s => s.id === samplerId)
  if (!sampler) return null

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className="p-2 rounded-lg"
        style={{ backgroundColor: `${sampler.color}20` }}
      >
        <span style={{ color: sampler.color }}>{sampler.icon}</span>
      </div>
      <div>
        <div className="font-medium text-fg">{sampler.name}</div>
        {showDescription && (
          <div className="text-sm text-fg-muted">{sampler.description}</div>
        )}
      </div>
    </div>
  )
}
