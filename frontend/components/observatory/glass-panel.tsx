"use client"

import { forwardRef, ReactNode } from 'react'
import { motion, HTMLMotionProps } from 'motion/react'
import { cn } from '@/lib/utils'

interface GlassPanelProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
  variant?: 'default' | 'elevated' | 'subtle' | 'accent'
  size?: 'sm' | 'md' | 'lg'
  glow?: boolean
  animated?: boolean
}

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ children, variant = 'default', size = 'md', glow = false, animated = true, className, ...props }, ref) => {
    const baseStyles = cn(
      'relative rounded-2xl overflow-hidden',
      'backdrop-blur-xl',
      'border transition-all duration-300',
      {
        // Variants
        'bg-surface/60 border-border': variant === 'default',
        'bg-surface-elevated/70 border-border shadow-elevated': variant === 'elevated',
        'bg-surface/30 border-border-subtle': variant === 'subtle',
        'bg-accent-muted/30 border-border-accent': variant === 'accent',

        // Sizes
        'p-3 sm:p-4': size === 'sm',
        'p-4 sm:p-6': size === 'md',
        'p-6 sm:p-8': size === 'lg',

        // Glow
        'glow-subtle': glow,
      },
      className
    )

    const content = (
      <>
        {/* Inner glow effect */}
        {variant === 'accent' && (
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.15) 0%, transparent 60%)'
            }}
          />
        )}

        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </>
    )

    if (animated) {
      return (
        <motion.div
          ref={ref as React.Ref<HTMLDivElement>}
          className={baseStyles}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          {...props}
        >
          {content}
        </motion.div>
      )
    }

    return (
      <div ref={ref} className={baseStyles} {...(props as React.HTMLAttributes<HTMLDivElement>)}>
        {content}
      </div>
    )
  }
)

GlassPanel.displayName = 'GlassPanel'

// Floating control panel variant - positioned absolutely
interface FloatingPanelProps extends GlassPanelProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center-bottom'
}

export function FloatingPanel({
  children,
  position = 'bottom-right',
  className,
  ...props
}: FloatingPanelProps) {
  const positionStyles = cn({
    'top-4 left-4': position === 'top-left',
    'top-4 right-4': position === 'top-right',
    'bottom-4 left-4': position === 'bottom-left',
    'bottom-4 right-4': position === 'bottom-right',
    'bottom-4 left-1/2 -translate-x-1/2': position === 'center-bottom',
  })

  return (
    <GlassPanel
      variant="elevated"
      className={cn('absolute z-50', positionStyles, className)}
      {...props}
    >
      {children}
    </GlassPanel>
  )
}

// Stats panel with value display
interface StatPanelProps {
  label: string
  value: string | number
  subValue?: string
  icon?: ReactNode
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}

export function StatPanel({
  label,
  value,
  subValue,
  icon,
  trend,
  className
}: StatPanelProps) {
  return (
    <GlassPanel
      variant="subtle"
      size="sm"
      className={cn('text-center', className)}
    >
      <div className="flex items-center justify-center gap-2 mb-2">
        {icon && (
          <span className="text-accent opacity-70">{icon}</span>
        )}
        <span className="text-xs sm:text-sm text-fg-muted font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>

      <div className="flex items-baseline justify-center gap-1">
        <span className="text-2xl sm:text-3xl font-display font-normal text-fg">
          {value}
        </span>
        {trend && (
          <span className={cn(
            'text-xs',
            trend === 'up' && 'text-green-400',
            trend === 'down' && 'text-red-400',
            trend === 'neutral' && 'text-fg-muted'
          )}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '—'}
          </span>
        )}
      </div>

      {subValue && (
        <span className="text-xs text-fg-subtle mt-1 block">
          {subValue}
        </span>
      )}
    </GlassPanel>
  )
}
