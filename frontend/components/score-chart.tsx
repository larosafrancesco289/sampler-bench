"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'

// Real data from llama318binstruct_judged_20250630-123120.json  
const data = [
  {
    name: 'standard_minp',
    score: 6.92,
    fill: '#10b981'
  },
  {
    name: 'llama_default', 
    score: 6.22,
    fill: '#f59e0b'
  },
  {
    name: 'creative_minp',
    score: 6.22,
    fill: '#8b5cf6'
  },
  {
    name: 'ultra_sigma',
    score: 5.70,
    fill: '#06b6d4'
  }
]

export function ScoreChart() {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            domain={[0, 10]}
            tick={{ fontSize: 12 }}
          />
          <Bar dataKey="score" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
} 