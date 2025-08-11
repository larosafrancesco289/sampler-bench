import type { Metadata, Viewport } from 'next'
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-canvas text-fg font-sans`}>
        <QueryProvider>
          <BenchmarkProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <div className="min-h-screen">
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