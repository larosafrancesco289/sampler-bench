"use client"

import { useMemo } from 'react'
import { motion } from 'motion/react'

interface ProbabilityBackdropProps {
  className?: string
  animated?: boolean
  variant?: 'hero' | 'subtle' | 'dense'
}

export function ProbabilityBackdrop({
  className = '',
  animated = true,
  variant = 'hero'
}: ProbabilityBackdropProps) {
  // Generate probability-like curve points
  const curves = useMemo(() => {
    const generateCurve = (seed: number, amplitude: number, offset: number) => {
      const points: string[] = []
      const segments = 50

      for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * 100
        // Create a bell-curve-like shape with some variation
        const normalX = (x - 50) / 20
        const y = offset + amplitude * Math.exp(-normalX * normalX) * (1 + 0.2 * Math.sin(seed + x * 0.1))
        points.push(`${x},${100 - y}`)
      }

      return `M0,100 L${points.join(' L')} L100,100 Z`
    }

    if (variant === 'hero') {
      return [
        { path: generateCurve(0, 60, 10), opacity: 0.08, delay: 0 },
        { path: generateCurve(1, 45, 15), opacity: 0.06, delay: 0.5 },
        { path: generateCurve(2, 30, 20), opacity: 0.04, delay: 1 },
      ]
    } else if (variant === 'dense') {
      return [
        { path: generateCurve(0, 40, 20), opacity: 0.1, delay: 0 },
        { path: generateCurve(1, 35, 25), opacity: 0.08, delay: 0.3 },
        { path: generateCurve(2, 30, 30), opacity: 0.06, delay: 0.6 },
        { path: generateCurve(3, 25, 35), opacity: 0.04, delay: 0.9 },
      ]
    } else {
      return [
        { path: generateCurve(0, 30, 30), opacity: 0.04, delay: 0 },
        { path: generateCurve(1, 20, 35), opacity: 0.03, delay: 0.5 },
      ]
    }
  }, [variant])

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          {/* Golden gradient for curves */}
          <linearGradient id="curve-gradient-gold" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
          </linearGradient>

          {/* Purple gradient for accent curves */}
          <linearGradient id="curve-gradient-purple" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--color-accent-2)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--color-accent-2)" stopOpacity="0" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="curve-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Render curves */}
        {curves.map((curve, index) => (
          <motion.path
            key={index}
            d={curve.path}
            fill="url(#curve-gradient-gold)"
            opacity={curve.opacity}
            filter="url(#curve-glow)"
            initial={animated ? { opacity: 0, translateY: 10 } : undefined}
            animate={animated ? { opacity: curve.opacity, translateY: 0 } : undefined}
            transition={{
              duration: 1.5,
              delay: curve.delay,
              ease: [0.16, 1, 0.3, 1]
            }}
          />
        ))}

        {/* Accent line at peak */}
        <motion.line
          x1="50"
          y1="0"
          x2="50"
          y2="100"
          stroke="var(--color-accent)"
          strokeWidth="0.1"
          strokeDasharray="2 2"
          opacity={0.15}
          initial={animated ? { opacity: 0 } : undefined}
          animate={animated ? { opacity: 0.15 } : undefined}
          transition={{ duration: 1, delay: 1.5 }}
        />
      </svg>

      {/* Floating particles effect */}
      {animated && variant === 'hero' && (
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-accent"
              style={{
                left: `${20 + i * 12}%`,
                top: `${30 + (i % 3) * 15}%`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.4, 0],
                scale: [0, 1, 0],
                y: [0, -30, -60]
              }}
              transition={{
                duration: 4,
                delay: i * 0.8,
                repeat: Infinity,
                repeatDelay: 2,
                ease: 'easeOut'
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Curve line component for section dividers
export function CurveDivider({
  className = '',
  inverted = false
}: {
  className?: string
  inverted?: boolean
}) {
  const path = useMemo(() => {
    const points: string[] = []
    const segments = 100

    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * 100
      const normalX = (x - 50) / 25
      const y = 50 + 40 * Math.exp(-normalX * normalX) * (inverted ? -1 : 1)
      points.push(`${x},${y}`)
    }

    return `M${points.join(' L')}`
  }, [inverted])

  return (
    <div className={`w-full h-16 overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <path
          d={path}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="0.3"
          opacity="0.3"
        />
      </svg>
    </div>
  )
}
