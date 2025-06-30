"use client"

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts'

const data = [
  {
    criterion: 'Narrative Coherence',
    creative_minp: 7.9,
    ultra_sigma: 7.2,
    standard_minp: 7.5,
    llama_default: 7.2,
  },
  {
    criterion: 'Creativity & Originality',
    creative_minp: 8.2,
    ultra_sigma: 8.4,
    standard_minp: 7.0,
    llama_default: 6.1,
  },
  {
    criterion: 'Character Development',
    creative_minp: 7.4,
    ultra_sigma: 7.1,
    standard_minp: 7.2,
    llama_default: 6.9,
  },
  {
    criterion: 'Engagement & Readability',
    creative_minp: 7.8,
    ultra_sigma: 7.8,
    standard_minp: 7.3,
    llama_default: 7.1,
  },
  {
    criterion: 'Stylistic Quality',
    creative_minp: 7.7,
    ultra_sigma: 7.5,
    standard_minp: 7.0,
    llama_default: 6.7,
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
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
} 