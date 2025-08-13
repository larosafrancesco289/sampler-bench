"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from './theme-toggle'
import { cn } from '@/lib/utils'
import { Github } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Leaderboard' },
  { href: '/mmlu', label: 'MMLU' },
  { href: '/findings', label: 'Key Findings' },
  { href: '/methodology', label: 'Methodology' },
  { href: '/visualizer', label: 'Visualizer' },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold text-fg mb-1 sm:mb-2">
          Sampler Bench
          </h1>
          <p className="text-sm sm:text-lg text-fg-muted">
            Comparing LLM sampling strategies for creative writing and MMLU accuracy
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <a
            href="https://github.com/larosafrancesco289/sampler-bench"
            target="_blank"
            rel="noopener noreferrer"
            className="text-fg-muted hover:text-fg transition-all duration-200 ease-out p-2 rounded-2xl hover:bg-muted transform hover:scale-110 active:scale-95"
            title="View on GitHub"
          >
            <Github className="h-5 w-5" />
          </a>
          <ThemeToggle />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 sm:gap-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-sm px-3 py-2 rounded-2xl transition-all duration-200 ease-out",
              pathname === item.href
                ? "bg-accent text-black shadow-sm"
                : "text-fg-muted hover:bg-muted hover:text-fg hover:shadow-sm"
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  )
}