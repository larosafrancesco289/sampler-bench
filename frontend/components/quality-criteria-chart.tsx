"use client"

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts'

// Real data from llama318binstruct_judged_20250630-123120.json
const data = [
  {
    criterion: 'Narrative Coherence',
    standard_minp: 7.2,
    llama_default: 6.5,
    creative_minp: 6.3,
    ultra_sigma: 5.8,
  },
  {
    criterion: 'Creativity & Originality',
    standard_minp: 6.8,
    llama_default: 6.0,
    creative_minp: 6.4,
    ultra_sigma: 5.9,
  },
  {
    criterion: 'Character Development',
    standard_minp: 6.9,
    llama_default: 6.2,
    creative_minp: 6.1,
    ultra_sigma: 5.5,
  },
  {
    criterion: 'Engagement & Readability',
    standard_minp: 7.1,
    llama_default: 6.3,
    creative_minp: 6.2,
    ultra_sigma: 5.7,
  },
  {
    criterion: 'Stylistic Quality',
    standard_minp: 6.7,
    llama_default: 6.1,
    creative_minp: 6.1,
    ultra_sigma: 5.6,
  },
]

export function QualityCriteriaChart() {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="criterion" tick={{ fontSize: 12 }} />
          <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
          <Radar
            name="standard_minp"
            dataKey="standard_minp"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.1}
          />
          <Radar
            name="llama_default"
            dataKey="llama_default"
            stroke="#f59e0b"
            fill="#f59e0b"
            fillOpacity={0.1}
          />
          <Radar
            name="creative_minp"
            dataKey="creative_minp"
            stroke="#8b5cf6"
            fill="#8b5cf6"
            fillOpacity={0.1}
          />
          <Radar
            name="ultra_sigma"
            dataKey="ultra_sigma"
            stroke="#06b6d4"
            fill="#06b6d4"
            fillOpacity={0.1}
          />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
} 