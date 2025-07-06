"use client"

import { useMemo, useState, useEffect, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Badge } from "@/components/ui/badge"

interface ProbabilityDistributionChartProps {
  sampler: string
  parameters: Record<string, number>
}

interface TokenData {
  token: string
  logit: number
  index?: number
}

interface LogitsData {
  model: string
  scenarios: Record<string, {
    prompt: string
    description: string
    tokens: TokenData[]
  }>
}

export function ProbabilityDistributionChart({ sampler, parameters }: ProbabilityDistributionChartProps) {
  const [logitsData, setLogitsData] = useState<LogitsData | null>(null)
  const [selectedScenario, setSelectedScenario] = useState<string>('article_start')
  const [dataSource, setDataSource] = useState<string>('loading')

  // Load the saved logits data
  useEffect(() => {
    const loadLogitsData = async () => {
      try {
        const response = await fetch('/logits-data.json')
        if (response.ok) {
          const data = await response.json()
          setLogitsData(data)
          setDataSource('real')
          
          // Set first available scenario as default
          const scenarios = Object.keys(data.scenarios || {})
          if (scenarios.length > 0) {
            setSelectedScenario(scenarios[0])
          }
        } else {
          throw new Error('Failed to load logits data')
        }
      } catch (error) {
        console.error('Failed to load logits data:', error)
        setDataSource('fallback')
      }
    }

    loadLogitsData()
  }, [])


  const generateFallbackTokens = useCallback((): TokenData[] => {
    const tokenPool = [
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'I',
      'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
      'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
      'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
      'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me'
    ]

    const topLogit = 8.5
    
    return tokenPool.map((token, index) => {
      const decay = Math.exp(-index * 0.25)
      const noise = (hash(token) % 100 - 50) / 100 * 0.4
      const logit = topLogit * decay + noise
      
      return {
        token,
        logit: Number(Math.max(-3, Math.min(logit, 10)).toFixed(3)),
        index
      }
    }).sort((a, b) => b.logit - a.logit)
  }, [])

  // Simple hash function for deterministic noise
  const hash = (str: string): number => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash)
  }

  const processedData = useMemo(() => {
    // Get tokens from the current scenario or generate fallback
    const getTokens = (): TokenData[] => {
      if (logitsData && logitsData.scenarios && logitsData.scenarios[selectedScenario]) {
        const scenario = logitsData.scenarios[selectedScenario]
        return scenario.tokens || []
      }
      
      // Fallback: generate realistic tokens
      return generateFallbackTokens()
    }

    const tokens = getTokens()
    const temperature = parameters.temperature || 1.0
    
    // Apply temperature scaling
    const scaledLogits = tokens.map(token => ({
      ...token,
      scaledLogit: token.logit / temperature
    }))

    // Convert to probabilities
    const maxLogit = Math.max(...scaledLogits.map(t => t.scaledLogit))
    const expLogits = scaledLogits.map(token => ({
      ...token,
      exp: Math.exp(token.scaledLogit - maxLogit) // Subtract max for numerical stability
    }))

    const sumExp = expLogits.reduce((sum, token) => sum + token.exp, 0)
    const probabilities = expLogits.map(token => ({
      ...token,
      probability: token.exp / sumExp
    }))

    // Apply sampler-specific filtering
    let filteredTokens = [...probabilities]
    let threshold = 0
    let selectedCount = probabilities.length

    switch (sampler) {
      case 'temperature':
        // No additional filtering for temperature-only
        break
        
      case 'top_p':
        const topP = parameters.top_p || 0.9
        filteredTokens.sort((a, b) => b.probability - a.probability)
        let cumulativeProb = 0
        let topPIndex = 0
        
        for (let i = 0; i < filteredTokens.length; i++) {
          cumulativeProb += filteredTokens[i].probability
          if (cumulativeProb >= topP) {
            topPIndex = i + 1
            break
          }
        }
        
        filteredTokens = filteredTokens.slice(0, topPIndex)
        selectedCount = topPIndex
        break
        
      case 'top_k':
        const topK = parameters.top_k || 50
        filteredTokens.sort((a, b) => b.probability - a.probability)
        filteredTokens = filteredTokens.slice(0, Math.min(topK, filteredTokens.length))
        selectedCount = Math.min(topK, filteredTokens.length)
        break
        
      case 'min_p':
        const minP = parameters.min_p || 0.1
        const maxProb = Math.max(...probabilities.map(t => t.probability))
        threshold = minP * maxProb
        filteredTokens = probabilities.filter(token => token.probability >= threshold)
        selectedCount = filteredTokens.length
        break
        
      case 'top_n_sigma':
        const nSigma = parameters.n_sigma || 3.0
        const logits = probabilities.map(t => t.scaledLogit)
        const maxLogitValue = Math.max(...logits)
        const mean = logits.reduce((sum, logit) => sum + logit, 0) / logits.length
        const variance = logits.reduce((sum, logit) => sum + (logit - mean) ** 2, 0) / logits.length
        const stdDev = Math.sqrt(variance)
        
        threshold = maxLogitValue - nSigma * stdDev
        filteredTokens = probabilities.filter(token => token.scaledLogit >= threshold)
        selectedCount = filteredTokens.length
        break
    }

    // Sort by probability for display
    filteredTokens.sort((a, b) => b.probability - a.probability)
    
    // Mark filtered tokens and create chart data
    const result = probabilities.map(token => {
      const isIncluded = filteredTokens.some(ft => ft.token === token.token)
      return {
        ...token,
        included: isIncluded,
        displayProbability: token.probability * 100, // Convert to percentage
        selectedProbability: isIncluded ? token.probability * 100 : 0,
        filteredProbability: isIncluded ? 0 : token.probability * 100
      }
    }).sort((a, b) => b.probability - a.probability)

    return {
      data: result.slice(0, 15), // Show top 15 tokens
      threshold,
      selectedCount,
      totalTokens: probabilities.length
    }
  }, [sampler, parameters, selectedScenario, logitsData, generateFallbackTokens])

  const formatTooltip = (value: number, name: string) => {
    if (name === 'Selected' || name === 'Filtered') {
      return [`${value.toFixed(2)}%`, name]
    }
    return [`${value.toFixed(2)}%`, 'Probability']
  }

  return (
    <div className="space-y-4">
      {/* Scenario Selection and Data Source */}
      {logitsData && logitsData.scenarios && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Scenario:</label>
            <select 
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
            >
              {Object.entries(logitsData.scenarios).map(([key, scenario]) => (
                <option key={key} value={key}>
                  {scenario.description || key} - &quot;{scenario.prompt}&quot;
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            <Badge variant={dataSource === 'real' ? "default" : "secondary"}>
              {dataSource === 'real' ? `Real ${logitsData.model} Data` : 'Simulated Data'}
            </Badge>
            {dataSource === 'real' && (
              <span className="text-gray-500">
                Generated from KoboldCpp
              </span>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex flex-wrap gap-2 text-sm">
        <Badge variant="outline">
          Selected: {processedData.selectedCount} / {processedData.totalTokens} tokens
        </Badge>
        <Badge variant="outline">
          Temperature: {parameters.temperature?.toFixed(1)}
        </Badge>
        {sampler !== 'temperature' && (
          <Badge variant="outline">
            {sampler}: {Object.entries(parameters).filter(([key]) => key !== 'temperature').map(([key, value]) => `${key}=${value}`).join(', ')}
          </Badge>
        )}
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={processedData.data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="token" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              label={{ 
                value: 'Probability (%)', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle' }
              }}
              width={60}
            />
            <Tooltip formatter={formatTooltip} />
            <Bar 
              dataKey="selectedProbability"
              fill="#3b82f6"
              name="Selected"
            />
            <Bar 
              dataKey="filteredProbability"
              fill="#e5e7eb"
              name="Filtered"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>Selected tokens</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-300 rounded"></div>
          <span>Filtered out</span>
        </div>
      </div>

      {/* Explanation */}
      <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
        <p>
          <strong>Visualization:</strong> This chart shows how the sampling strategy affects token selection. 
          The height of each bar represents the probability of that token being selected. 
          {sampler === 'temperature' && " Temperature scaling changes the shape of the distribution."}
          {sampler === 'top_p' && " Top-p sampling includes tokens until cumulative probability reaches the threshold."}
          {sampler === 'top_k' && " Top-k sampling includes only the k most likely tokens."}
          {sampler === 'min_p' && " Min-p sampling filters tokens based on a threshold relative to the top token."}
          {sampler === 'top_n_sigma' && " Top-nσ sampling uses statistical analysis to separate signal from noise."}
        </p>
      </div>
    </div>
  )
}