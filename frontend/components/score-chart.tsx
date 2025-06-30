"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  {
    name: 'creative_minp',
    score: 7.8,
  },
  {
    name: 'ultra_sigma',
    score: 7.6,
  },
  {
    name: 'standard_minp',
    score: 7.2,
  },
  {
    name: 'llama_default',
    score: 6.8,
  },
]

export function ScoreChart() {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={[0, 10]} />
          <Tooltip />
          <Bar dataKey="score" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
} 