import { NextResponse } from 'next/server'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import type { BenchmarkResults, LeaderboardEntry } from '../../../types/benchmark'
import { processBenchmarkData } from '../../../lib/data-processor'

export async function GET() {
  try {
    // Path to MMLU results directory (relative to project root)
    const resultsPath = join(process.cwd(), '..', 'results', 'mmlu')

    // Read all files in results/mmlu directory
    const files = await readdir(resultsPath)

    // Filter for judged results files
    const judgedFiles = files.filter(file =>
      file.includes('_judged_') && file.endsWith('.json')
    )

    if (judgedFiles.length === 0) {
      return NextResponse.json({ error: 'No MMLU results found' }, { status: 404 })
    }

    // Load and process all benchmark results
    const allEntries: LeaderboardEntry[] = []
    const benchmarkData: BenchmarkResults[] = []

    for (const file of judgedFiles) {
      try {
        const filePath = join(resultsPath, file)
        const fileContent = await readFile(filePath, 'utf-8')
        const benchmarkResult: BenchmarkResults = JSON.parse(fileContent)

        benchmarkData.push(benchmarkResult)

        // Process each file's data into leaderboard entries
        const entries = processBenchmarkData(benchmarkResult)

        // Add model context to entries to distinguish between different models
        const enhancedEntries = entries.map(entry => ({
          ...entry,
          model_name: benchmarkResult.model_name,
          sampler_name: `${entry.sampler_name} (${benchmarkResult.model_name})`
        }))

        allEntries.push(...enhancedEntries)
      } catch (error) {
        console.error(`Error processing MMLU file ${file}:`, error)
      }
    }

    // Sort all entries by average score (accuracy 0..1)
    allEntries.sort((a, b) => b.average_score - a.average_score)

    // Calculate summary stats (treat average_score as accuracy 0..1)
    const totalSamples = allEntries.reduce((sum, entry) => sum + entry.total_samples, 0)
    const uniqueSamplers = new Set(allEntries.map(entry => entry.sampler_name.split(' (')[0])).size
    const avgAccuracy = allEntries.length > 0
      ? allEntries.reduce((sum, entry) => sum + entry.average_score, 0) / allEntries.length
      : 0

    return NextResponse.json({
      leaderboard: allEntries,
      summary: {
        total_samples: totalSamples,
        unique_samplers: uniqueSamplers,
        // Keep same field name for UI reuse; represents accuracy here
        avg_quality_score: Number((avgAccuracy * 100).toFixed(1)),
        models_tested: benchmarkData.length,
        last_updated: new Date().toISOString()
      },
      raw_data: benchmarkData
    })
  } catch (error) {
    console.error('Error loading MMLU results:', error)
    return NextResponse.json(
      { error: 'Failed to load MMLU results' },
      { status: 500 }
    )
  }
}


