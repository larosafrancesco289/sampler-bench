import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { QueryProvider } from '@/components/query-provider'
import { BenchmarkProvider } from '@/contexts/benchmark-context'

export const metadata: Metadata = {
  title: 'SamplerBench - The Sampling Observatory',
  description: 'Explore how sampling strategies shape language model output quality through interactive visualizations and benchmarks',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#08070a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-canvas text-fg font-sans antialiased">
        <QueryProvider>
          <BenchmarkProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem={false}
              disableTransitionOnChange={false}
            >
              {/* Observatory Background */}
              <div className="fixed inset-0 pointer-events-none overflow-hidden">
                {/* Hero glow at top */}
                <div
                  className="absolute -top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] opacity-100"
                  style={{
                    background: 'radial-gradient(ellipse 100% 80% at 50% 0%, rgba(212,175,55,0.08) 0%, transparent 60%)'
                  }}
                />

                {/* Accent orbs */}
                <div
                  className="absolute top-1/4 -left-32 w-[500px] h-[500px] opacity-100"
                  style={{
                    background: 'radial-gradient(circle at center, rgba(212,175,55,0.04) 0%, transparent 50%)'
                  }}
                />
                <div
                  className="absolute bottom-1/4 -right-32 w-[400px] h-[400px] opacity-100"
                  style={{
                    background: 'radial-gradient(circle at center, rgba(123,63,160,0.05) 0%, transparent 50%)'
                  }}
                />

                {/* Grid pattern overlay */}
                <div className="absolute inset-0 grid-pattern opacity-50" />

                {/* Grain texture */}
                <div className="absolute inset-0 grain" />
              </div>

              {/* Main content */}
              <div className="relative min-h-screen">
                {children}
              </div>
            </ThemeProvider>
          </BenchmarkProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
