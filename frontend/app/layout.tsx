import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { QueryProvider } from '@/components/query-provider'
import { BenchmarkProvider } from '@/contexts/benchmark-context'
import { PageTransition } from '@/components/page-transition'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sampler Bench - LLM Sampling Strategy Leaderboard',
  description: 'Professional benchmarking platform for evaluating LLM sampling strategies on creative writing tasks',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <QueryProvider>
          <BenchmarkProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                <PageTransition>
                  {children}
                </PageTransition>
              </div>
            </ThemeProvider>
          </BenchmarkProvider>
        </QueryProvider>
      </body>
    </html>
  )
} 