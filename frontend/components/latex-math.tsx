"use client"

import { InlineMath, BlockMath } from 'react-katex'

interface LatexMathProps {
  children: string
  block?: boolean
  className?: string
}

export function LatexMath({ children, block = false, className = "" }: LatexMathProps) {
  if (block) {
    return (
      <div className={`my-4 overflow-x-auto ${className}`}>
        <BlockMath math={children} />
      </div>
    )
  }

  return (
    <span className={className}>
      <InlineMath math={children} />
    </span>
  )
}