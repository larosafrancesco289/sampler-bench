"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from './theme-toggle'
import { cn } from '@/lib/utils'
import { Github } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Leaderboard' },
  { href: '/findings', label: 'Key Findings' },
  { href: '/methodology', label: 'Methodology' },
  { href: '/visualizer', label: 'Visualizer' },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Sampler Bench
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Comparing LLM sampling strategies for creative writing
        </p>
      </div>
      <div className="flex items-center gap-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-sm px-3 py-2 rounded-md transition-colors",
              pathname === item.href
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                : "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950"
            )}
          >
            {item.label}
          </Link>
        ))}
        <a
          href="https://github.com/larosafrancesco289/sampler-bench"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          title="View on GitHub"
        >
          <Github className="h-5 w-5" />
        </a>
        <ThemeToggle />
      </div>
    </div>
  )
}