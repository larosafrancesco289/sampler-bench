"use client"

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { ThemeToggle } from './theme-toggle'
import { cn } from '@/lib/utils'
import { Activity, Github, Menu, X, Trophy, FlaskConical, Lightbulb, BookOpen } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Observatory', icon: Activity, description: 'Home' },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy, description: 'Rankings' },
  { href: '/lab', label: 'The Lab', icon: FlaskConical, description: 'Visualizer' },
  { href: '/findings', label: 'Findings', icon: Lightbulb, description: 'Insights' },
  { href: '/methodology', label: 'Methodology', icon: BookOpen, description: 'Docs' },
]

export function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="relative z-50">
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center justify-between py-6">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center shadow-lg group-hover:shadow-accent/30 transition-shadow duration-300">
              <Activity className="w-5 h-5 text-black" />
            </div>
            <div className="absolute -inset-1 bg-gradient-to-br from-accent to-accent-2 rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300" />
          </div>
          <div>
            <span className="text-xl font-display text-fg">SamplerBench</span>
            <div className="h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-accent to-accent-2 transition-all duration-300" />
          </div>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1 p-1 bg-surface/50 backdrop-blur-sm rounded-full border border-border-subtle">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 flex items-center gap-2",
                  isActive
                    ? "text-black"
                    : "text-fg-muted hover:text-fg"
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 bg-accent rounded-full shadow-lg shadow-accent/20"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon className={cn("w-4 h-4 relative z-10", isActive && "text-black")} />
                <span className="relative z-10">{item.label}</span>
              </Link>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/larosafrancesco289/sampler-bench"
            target="_blank"
            rel="noopener noreferrer"
            className="group p-2.5 rounded-xl text-fg-muted hover:text-fg transition-all duration-300 hover:bg-surface border border-transparent hover:border-border"
            title="View on GitHub"
          >
            <Github className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
          </a>
          <ThemeToggle />
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden flex items-center justify-between py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center">
            <Activity className="w-4 h-4 text-black" />
          </div>
          <span className="text-lg font-display text-fg">SamplerBench</span>
        </Link>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-xl text-fg-muted hover:text-fg transition-colors bg-surface border border-border"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden absolute top-full left-0 right-0 mt-2 p-4 bg-surface/95 backdrop-blur-xl border border-border rounded-2xl shadow-elevated z-50"
          >
            <div className="space-y-1">
              {navItems.map((item, index) => {
                const isActive = pathname === item.href
                const Icon = item.icon

                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                        isActive
                          ? "bg-accent text-black"
                          : "text-fg-muted hover:text-fg hover:bg-surface-elevated"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <div>
                        <span className="font-medium block">{item.label}</span>
                        <span className={cn(
                          "text-xs",
                          isActive ? "text-black/70" : "text-fg-subtle"
                        )}>{item.description}</span>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}

              {/* GitHub Link */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: navItems.length * 0.05 }}
              >
                <a
                  href="https://github.com/larosafrancesco289/sampler-bench"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-fg-muted hover:text-fg hover:bg-surface-elevated transition-all duration-200"
                >
                  <Github className="w-5 h-5" />
                  <div>
                    <span className="font-medium block">GitHub</span>
                    <span className="text-xs text-fg-subtle">View source code</span>
                  </div>
                </a>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
