'use client';

import { AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Users, BarChart3, Brain } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Navigation } from '@/components/navigation';
import { useBenchmarkContext } from '@/contexts/benchmark-context';
import { useMemo } from 'react';

export default function FindingsPage() {
  const { data, summary, loading, error } = useBenchmarkContext();

  // Calculate dynamic insights
  const insights = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Get unique models
    const models = [...new Set(data.map(entry => entry.model_name).filter(Boolean))];
    
    // Calculate model performance rankings (filter out models with too few samples)
    const modelPerformance = models.map(model => {
      const modelEntries = data.filter(entry => entry.model_name === model);
      const avgScore = modelEntries.reduce((sum, entry) => sum + entry.average_score, 0) / modelEntries.length;
      const totalSamples = modelEntries.reduce((sum, entry) => sum + entry.total_samples, 0);
      
      return {
        model,
        avgScore,
        totalSamples,
        entries: modelEntries
      };
    }).filter(model => model.totalSamples >= 15) // Filter out models with < 15 samples
      .sort((a, b) => b.avgScore - a.avgScore);

    // Calculate sampler performance (only from models with sufficient samples)
    const samplerGroups = new Map<string, { scores: number[], totalSamples: number }>();
    
    // Filter data to only include models with sufficient samples
    const filteredData = data.filter(entry => {
      const modelName = entry.model_name || '';
      const modelEntries = data.filter(e => e.model_name === modelName);
      const totalSamples = modelEntries.reduce((sum, e) => sum + e.total_samples, 0);
      return totalSamples >= 15;
    });
    
    filteredData.forEach(entry => {
      let samplerName = entry.sampler_name;
      // Remove model name from sampler name if present
      const match = samplerName.match(/^([^(]+)(?:\s*\([^)]+\))?/);
      if (match) {
        samplerName = match[1].trim();
      }
      
      if (!samplerGroups.has(samplerName)) {
        samplerGroups.set(samplerName, { scores: [], totalSamples: 0 });
      }
      
      const group = samplerGroups.get(samplerName)!;
      group.scores.push(entry.average_score);
      group.totalSamples += entry.total_samples;
    });

    const samplerPerformance = Array.from(samplerGroups.entries())
      .map(([name, data]) => ({
        name,
        avgScore: data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length,
        totalSamples: data.totalSamples
      }))
      .sort((a, b) => b.avgScore - a.avgScore);

    // Calculate consensus strength (only from filtered data)
    const consensusStrengths = filteredData
      .filter(entry => entry.avg_consensus_strength != null)
      .map(entry => entry.avg_consensus_strength!);
    
    const avgConsensus = consensusStrengths.length > 0 
      ? consensusStrengths.reduce((sum, val) => sum + val, 0) / consensusStrengths.length 
      : 0;

    return {
      modelPerformance,
      samplerPerformance,
      avgConsensus,
      excludedModels: models.filter(model => {
        const modelEntries = data.filter(entry => entry.model_name === model);
        const totalSamples = modelEntries.reduce((sum, entry) => sum + entry.total_samples, 0);
        return totalSamples < 15;
      }).map(model => {
        const modelEntries = data.filter(entry => entry.model_name === model);
        const totalSamples = modelEntries.reduce((sum, entry) => sum + entry.total_samples, 0);
        return { model, totalSamples };
      })
    };
  }, [data]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Navigation />
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">Key Findings & Insights</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Loading benchmark analysis...
          </p>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data || !insights) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Navigation />
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">Key Findings & Insights</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Analysis of benchmark results showing model performance differences and evaluation insights.
          </p>
        </div>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Unable to Load Data</AlertTitle>
          <AlertDescription>
            {error || "No benchmark data available. Please run a benchmark first."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Navigation />
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">Key Findings & Insights</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Analysis of benchmark results showing model performance differences and evaluation insights.
        </p>
      </div>

      {/* Executive Summary */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {insights.modelPerformance.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Models Evaluated
                {insights.excludedModels.length > 0 && (
                  <div className="text-xs text-yellow-600 mt-1">
                    ({insights.excludedModels.length} excluded)
                  </div>
                )}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {summary?.total_samples || data.reduce((sum, entry) => sum + entry.total_samples, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Samples</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {(insights.avgConsensus * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Average Judge Consensus</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Model Performance Analysis
          </CardTitle>
          <CardDescription>
            Dynamic analysis of model performance based on current benchmark data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Top Model Analysis */}
          {insights.modelPerformance.length > 0 && (
            <Alert>
              <Brain className="h-4 w-4" />
              <AlertTitle>Top Performing Model: {insights.modelPerformance[0].model}</AlertTitle>
              <AlertDescription>
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Overall Score:</span>
                    <Badge variant="outline">
                      {insights.modelPerformance[0].avgScore.toFixed(3)} / 10
                    </Badge>
                  </div>
                  <p className="text-sm">
                    {insights.modelPerformance[0].model} achieved the highest average score with {insights.modelPerformance[0].totalSamples} samples.
                    {insights.modelPerformance.length > 1 && (
                      <span> Performance advantage over second-place {insights.modelPerformance[1].model}: <strong>+{(insights.modelPerformance[0].avgScore - insights.modelPerformance[1].avgScore).toFixed(3)} points</strong></span>
                    )}
                  </p>
                  
                  {/* Show criteria breakdown for top model */}
                  {insights.modelPerformance[0].entries.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                      {Object.entries(insights.modelPerformance[0].entries[0].criteria_breakdown).map(([criterion, score]) => (
                        <div key={criterion}>
                          <div className="font-medium">{criterion.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                          <div className="text-muted-foreground">{score.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Model Ranking */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Model Performance Ranking</h3>
            <div className="space-y-2">
              {insights.modelPerformance.map((model, index) => {
                const bgColor = index === 0 ? 'bg-green-50 dark:bg-green-950' : 
                               index === 1 ? 'bg-blue-50 dark:bg-blue-950' : 
                               'bg-gray-50 dark:bg-gray-950';
                
                const badgeColor = index === 0 ? 'bg-green-100 dark:bg-green-900' : 
                                 index === 1 ? 'bg-blue-100 dark:bg-blue-900' : 
                                 'bg-gray-100 dark:bg-gray-900';
                
                return (
                  <div key={model.model} className={`flex items-center justify-between p-3 ${bgColor} rounded-lg`}>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={badgeColor}>
                        {index + 1}{index === 0 ? 'st' : index === 1 ? 'nd' : index === 2 ? 'rd' : 'th'}
                      </Badge>
                      <span className="font-medium">{model.model}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        ({model.totalSamples} samples)
                      </span>
                    </div>
                    <span className="font-bold">{model.avgScore.toFixed(3)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sampling Strategy Insights */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Sampling Strategy Analysis
          </CardTitle>
          <CardDescription>
            Performance comparison across different sampling methods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <BarChart3 className="h-4 w-4" />
            <AlertTitle>
              {insights.samplerPerformance.length > 1 && (insights.samplerPerformance[0].avgScore - insights.samplerPerformance[insights.samplerPerformance.length - 1].avgScore) < 0.5 
                ? "Minimal Impact of Sampling Strategies" 
                : "Significant Sampling Strategy Differences"}
            </AlertTitle>
            <AlertDescription>
              <div className="mt-2">
                <p className="text-sm mb-3">
                  {insights.samplerPerformance.length > 1 ? (
                    (insights.samplerPerformance[0].avgScore - insights.samplerPerformance[insights.samplerPerformance.length - 1].avgScore) < 0.5 
                      ? `Across ${insights.samplerPerformance.reduce((sum, s) => sum + s.totalSamples, 0)} samples, different sampling strategies show surprisingly small performance differences (${(insights.samplerPerformance[0].avgScore - insights.samplerPerformance[insights.samplerPerformance.length - 1].avgScore).toFixed(3)} point range).`
                      : `Analysis of ${insights.samplerPerformance.reduce((sum, s) => sum + s.totalSamples, 0)} samples reveals meaningful differences between sampling strategies (${(insights.samplerPerformance[0].avgScore - insights.samplerPerformance[insights.samplerPerformance.length - 1].avgScore).toFixed(3)} point range).`
                  ) : `Single sampling strategy evaluated with ${insights.samplerPerformance[0]?.totalSamples || 0} samples.`}
                </p>
                <div className="space-y-2">
                  {insights.samplerPerformance.slice(0, 5).map((sampler) => (
                    <div key={sampler.name} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-950 rounded">
                      <span className="font-medium text-sm">{sampler.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{sampler.avgScore.toFixed(3)}</span>
                        <span className="text-xs text-gray-500">({sampler.totalSamples} samples)</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Analysis based on actual performance differences */}
                {insights.samplerPerformance.length > 1 && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded">
                    <p className="text-sm">
                      <strong>Key Finding:</strong> {
                        (insights.samplerPerformance[0].avgScore - insights.samplerPerformance[insights.samplerPerformance.length - 1].avgScore) < 0.3 
                          ? "Sampling parameters have minimal impact on creative writing quality. Model choice appears more important than sampling strategy."
                          : (insights.samplerPerformance[0].avgScore - insights.samplerPerformance[insights.samplerPerformance.length - 1].avgScore) < 0.8
                          ? `Minimal sampling strategy effects observed. The ${(insights.samplerPerformance[0].avgScore - insights.samplerPerformance[insights.samplerPerformance.length - 1].avgScore).toFixed(3)} difference represents only ${((insights.samplerPerformance[0].avgScore - insights.samplerPerformance[insights.samplerPerformance.length - 1].avgScore) / 10 * 100).toFixed(1)}% of the evaluation scale and is below typical human judgment noise levels.`
                          : "Strong sampling strategy effects detected. Choice of sampling parameters significantly impacts output quality."
                      }
                    </p>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>

          {/* Instruction Following Analysis */}
          {insights.modelPerformance.length > 1 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Instruction Following Analysis
              </h3>
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-sm mb-3">
                  Word count compliance serves as an objective measure of instruction following.
                </p>
                <div className="space-y-2">
                  {insights.modelPerformance.map((model) => {
                    // Calculate compliance based on word count consistency
                    const wordCounts = model.entries.map(e => e.avg_word_count).filter(Boolean);
                    const avgWordCount = wordCounts.reduce((sum, count) => sum + count, 0) / wordCounts.length;
                    const targetRange = [300, 400]; // Expected range
                    const compliance = wordCounts.filter(count => count >= targetRange[0] && count <= targetRange[1]).length / wordCounts.length;
                    
                    const complianceColor = compliance > 0.9 ? 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900' :
                                          compliance > 0.7 ? 'text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900' :
                                          'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900';
                    
                    return (
                      <div key={model.model} className="flex justify-between items-center">
                        <span className="font-medium">{model.model}:</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={complianceColor}>
                            {(compliance * 100).toFixed(0)}% compliance
                          </Badge>
                          <span className="text-xs text-gray-500">
                            (avg: {avgWordCount.toFixed(0)} words)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Models with higher instruction compliance typically achieve better overall quality scores, suggesting this metric captures important capabilities.
                </p>
              </div>
            </div>
          )}

          {/* Judge Consensus Analysis */}
          {insights.avgConsensus > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Judge Consensus Analysis
              </h3>
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Average Consensus:</span>
                  <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900">
                    {(insights.avgConsensus * 100).toFixed(1)}%
                  </Badge>
                </div>
                <p className="text-sm">
                  {insights.avgConsensus > 0.85 ? "High judge agreement indicates clear quality differences and reliable evaluation."
                   : insights.avgConsensus > 0.7 ? "Moderate judge agreement suggests some subjectivity but reasonable consistency."
                   : "Low judge agreement indicates high evaluation subjectivity or potential issues with judge models."}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Creative writing evaluation naturally involves subjectivity. {(insights.avgConsensus * 100).toFixed(1)}% consensus is {insights.avgConsensus > 0.8 ? "strong" : insights.avgConsensus > 0.7 ? "reasonable" : "concerning"} for this domain.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Excluded Models Notice */}
      {insights.excludedModels && insights.excludedModels.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Excluded from Analysis
            </CardTitle>
            <CardDescription>
              Models with insufficient sample sizes for reliable comparison
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.excludedModels.map((model) => (
                <div key={model.model} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <span className="font-medium">{model.model}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {model.totalSamples} samples (minimum: 15)
                  </span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Models with fewer than 15 samples are excluded from performance analysis to ensure statistical reliability.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Data Freshness Notice */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Live Data Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This analysis is automatically generated from your current benchmark data. 
            Results will update when you run new benchmarks or modify the dataset.
          </p>
          {summary?.last_updated && (
            <p className="text-xs text-muted-foreground mt-2">
              Last updated: {new Date(summary.last_updated).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
