import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

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
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
          {children}
        </div>
      </body>
    </html>
  )
} 