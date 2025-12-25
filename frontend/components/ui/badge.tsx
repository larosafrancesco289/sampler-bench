import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  [
    "inline-flex items-center gap-1.5 font-medium transition-colors",
    "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-canvas",
  ].join(" "),
  {
    variants: {
      variant: {
        // Default golden badge
        default: "bg-accent text-black",
        // Secondary muted badge
        secondary: "bg-surface-elevated text-fg border border-border",
        // Outlined badge
        outline: "bg-transparent border border-border text-fg-muted",
        // Destructive badge
        destructive: "bg-red-600/20 text-red-400 border border-red-600/30",
        // Success badge
        success: "bg-green-600/20 text-green-400 border border-green-600/30",
        // Purple accent badge
        accent2: "bg-accent-2/20 text-[#c084fc] border border-accent-2/30",
        // Golden accent subtle
        accent: "bg-accent-muted text-accent border border-accent/30",
        // Ghost badge
        ghost: "bg-transparent text-fg-muted",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs rounded-full",
        sm: "px-2 py-0.5 text-[10px] rounded-full",
        lg: "px-3 py-1 text-sm rounded-full",
        // Pill variant for longer content
        pill: "px-3 py-1 text-xs rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Optional leading icon */
  icon?: React.ReactNode
  /** Optional dot indicator */
  dot?: boolean
  /** Dot color for status indication */
  dotColor?: 'gold' | 'green' | 'red' | 'purple' | 'gray'
}

function Badge({
  className,
  variant,
  size,
  icon,
  dot,
  dotColor = 'gold',
  children,
  ...props
}: BadgeProps) {
  const dotColors = {
    gold: 'bg-accent',
    green: 'bg-green-400',
    red: 'bg-red-400',
    purple: 'bg-accent-2',
    gray: 'bg-fg-subtle',
  }

  return (
    <div
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {dot && (
        <span className={cn("w-1.5 h-1.5 rounded-full", dotColors[dotColor])} />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </div>
  )
}

// Score badge with visual bar
interface ScoreBadgeProps {
  score: number
  maxScore?: number
  label?: string
  showBar?: boolean
  className?: string
}

function ScoreBadge({
  score,
  maxScore = 10,
  label,
  showBar = true,
  className
}: ScoreBadgeProps) {
  const percentage = (score / maxScore) * 100

  // Color based on score
  const getColor = () => {
    if (percentage >= 80) return 'text-green-400 bg-green-600/20'
    if (percentage >= 60) return 'text-accent bg-accent-muted'
    if (percentage >= 40) return 'text-yellow-400 bg-yellow-600/20'
    return 'text-red-400 bg-red-600/20'
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {label && (
        <span className="text-xs text-fg-muted">{label}</span>
      )}
      <div className="flex items-center gap-1.5">
        <span className={cn(
          "px-2 py-0.5 rounded-md text-xs font-mono font-medium",
          getColor()
        )}>
          {score.toFixed(2)}
        </span>
        {showBar && (
          <div className="w-16 h-1.5 bg-surface-elevated rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${percentage}%`,
                background: 'var(--gradient-accent)'
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// Rank badge with medal styling
interface RankBadgeProps {
  rank: number
  className?: string
}

function RankBadge({ rank, className }: RankBadgeProps) {
  const getMedalStyle = () => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-lg shadow-amber-500/30'
      case 2:
        return 'bg-gradient-to-br from-slate-300 to-slate-400 text-black shadow-lg shadow-slate-400/30'
      case 3:
        return 'bg-gradient-to-br from-orange-400 to-orange-600 text-black shadow-lg shadow-orange-500/30'
      default:
        return 'bg-surface-elevated text-fg-muted border border-border'
    }
  }

  const getSuffix = () => {
    if (rank === 1) return 'st'
    if (rank === 2) return 'nd'
    if (rank === 3) return 'rd'
    return 'th'
  }

  return (
    <div className={cn(
      "inline-flex items-baseline justify-center min-w-[2.5rem] px-2 py-1 rounded-lg text-sm font-medium",
      getMedalStyle(),
      className
    )}>
      <span className="font-bold">{rank}</span>
      <span className="text-[10px] opacity-70">{getSuffix()}</span>
    </div>
  )
}

export { Badge, badgeVariants, ScoreBadge, RankBadge }
