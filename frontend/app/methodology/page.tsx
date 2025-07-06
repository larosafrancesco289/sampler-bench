"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navigation } from "@/components/navigation"
import { Target, Brain, BarChart, Settings, Users, Zap } from "lucide-react"

export default function MethodologyPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <Navigation />
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Benchmark Methodology
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Understanding the quality-focused evaluation framework for LLM sampling strategies
        </p>
      </div>

      {/* Overview Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Project Overview
          </CardTitle>
          <CardDescription>
            Sampler Bench is a professional benchmarking platform designed to evaluate LLM sampling strategies on creative writing tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed">
            A production-quality benchmarking system that evaluates 5 core sampling strategies across multiple LLM models 
            using sophisticated multi-judge consensus evaluation. The platform prioritizes statistical rigor and writing quality 
            over speed, with comprehensive quality control and reliability measures.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">5 Core Sampling Methods</Badge>
            <Badge variant="secondary">Multi-Judge Consensus</Badge>
            <Badge variant="secondary">Quality Control</Badge>
            <Badge variant="secondary">Statistical Rigor</Badge>
            <Badge variant="secondary">Production-Ready</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Methodology Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Generation Process */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Generation Process
            </CardTitle>
            <CardDescription>How text samples are generated using various sampling strategies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-1">1. Model Server</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  KoboldCpp server hosts the LLM model for local inference
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">2. Prompt Processing</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Creative writing prompts are processed with configured sampling parameters
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">3. Sample Generation</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Multiple samples generated per strategy with full configuration tracking
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Evaluation Framework */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Evaluation Framework
            </CardTitle>
            <CardDescription>Multi-judge LLM-as-a-Judge quality assessment system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-1">Single Judge Mode</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  OpenAI GPT-4 evaluates on 5 weighted criteria (legacy mode)
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Multi-Judge System</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Multiple LLM judges via OpenRouter with consensus scoring for enhanced reliability
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Score Aggregation</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Weighted average across criteria with detailed breakdowns (1-10 scale)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Quality Criteria */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Quality Evaluation Criteria
          </CardTitle>
          <CardDescription>
            Comprehensive assessment framework with two evaluation modes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Single Judge Criteria */}
            <div>
              <h3 className="font-semibold mb-3 text-sm">Single Judge System (Legacy)</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-sm">Narrative Coherence</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Story flow and consistency</p>
                  </div>
                  <Badge variant="outline" className="text-xs">25%</Badge>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-sm">Creativity & Originality</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Unique ideas and expression</p>
                  </div>
                  <Badge variant="outline" className="text-xs">25%</Badge>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-sm">Character Development</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Character depth and believability</p>
                  </div>
                  <Badge variant="outline" className="text-xs">20%</Badge>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-sm">Engagement & Readability</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Reader interest and accessibility</p>
                  </div>
                  <Badge variant="outline" className="text-xs">20%</Badge>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-sm">Stylistic Quality</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Writing technique and language use</p>
                  </div>
                  <Badge variant="outline" className="text-xs">10%</Badge>
                </div>
              </div>
            </div>

            {/* Multi-Judge Criteria */}
            <div>
              <h3 className="font-semibold mb-3 text-sm">Multi-Judge System (Primary)</h3>
              <div className="space-y-3">
                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs mb-3">
                  <strong>Judge Models:</strong> openai/gpt-4.1-nano, google/gemini-2.0-flash-001 via OpenRouter
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-sm">Narrative Structure</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Story organization, pacing, and plot coherence</p>
                  </div>
                  <Badge variant="outline" className="text-xs">30%</Badge>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-sm">Creativity Execution</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Creative premise handling and original elements</p>
                  </div>
                  <Badge variant="outline" className="text-xs">25%</Badge>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-sm">Character Voice</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Character development and authentic voice</p>
                  </div>
                  <Badge variant="outline" className="text-xs">20%</Badge>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-sm">Prose Quality</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Writing craft, style, and language use</p>
                  </div>
                  <Badge variant="outline" className="text-xs">15%</Badge>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-sm">Engagement</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Reader interest and emotional impact</p>
                  </div>
                  <Badge variant="outline" className="text-xs">10%</Badge>
                </div>
                <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                  <strong>Quality Control:</strong> -1.5 pts word count violations, -0.8 pts meta-commentary, -3.0 pts failed generation
                </div>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Core Sampling Strategies */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Core Sampling Strategies (5 Methods)
          </CardTitle>
          <CardDescription>
            Research-focused evaluation of proven sampling methods with quality-oriented configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">model_default</h4>
                  <Badge variant="outline" className="text-xs">Dynamic</Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Dynamically resolves to model-specific optimal settings (Llama: temp 0.6, top_p 0.9; Mistral Small: temp 0.15; etc.)
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">standard_minp</h4>
                  <Badge variant="outline" className="text-xs">temp 0.7, min_p 0.02</Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Min-p sampling with conservative temperature 0.7 and min_p threshold 0.02
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">creative_minp</h4>
                  <Badge variant="outline" className="text-xs">temp 1.0, min_p 0.02</Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Min-p sampling with moderate temperature 1.0 and min_p threshold 0.02
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">standard_sigma</h4>
                  <Badge variant="outline" className="text-xs">temp 1.5, σ 1.0</Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Top-n-sigma sampling with high temperature 1.5 and standard deviation threshold 1.0
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">creative_sigma</h4>
                  <Badge variant="outline" className="text-xs">temp 1.0, σ 1.5</Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Top-n-sigma sampling with moderate temperature 1.0 and relaxed sigma threshold 1.5
                </p>
              </div>

            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Implementation */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Technical Implementation
          </CardTitle>
          <CardDescription>
            Production-quality architecture with sophisticated evaluation framework
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Infrastructure & Workflow</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• <strong>KoboldCpp servers</strong> for local model inference (multiple ports)</li>
                <li>• <strong>Script-based workflow</strong> with generation and evaluation phases</li>
                <li>• <strong>OpenRouter API</strong> for multi-judge consensus evaluation</li>
                <li>• <strong>Next.js frontend</strong> reading JSON results directly</li>
                <li>• <strong>Parallel processing</strong> for multi-judge evaluation efficiency</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Quality & Reliability Features</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• <strong>Dynamic model resolution</strong> with family-specific defaults</li>
                <li>• <strong>Instruction following penalties</strong> (-1.5 for word count violations)</li>
                <li>• <strong>Meta-commentary detection</strong> (-0.8 for author notes)</li>
                <li>• <strong>Statistical reliability</strong> metrics (std dev, consensus strength)</li>
                <li>• <strong>Structured JSON outputs</strong> for compatible judge models</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-md">
            <h4 className="font-medium mb-2 text-sm">Sample Scale & Statistical Rigor</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <strong>20 samples per sampler</strong><br/>
                5 creative writing prompts × 4 repetitions each
              </div>
              <div>
                <strong>300-400 word stories</strong><br/>
                Target length with compliance scoring
              </div>
              <div>
                <strong>Multi-judge consensus</strong><br/>
                Parallel evaluation with reliability metrics
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Interpretation */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Score Interpretation</CardTitle>
          <CardDescription>
            Understanding the 1-10 quality scale
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">9-10 Points</span>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Exceptional</Badge>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Exceptional creative writing with outstanding quality across all criteria
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">7-8 Points</span>
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">Good</Badge>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Good quality writing with strong elements and minor areas for improvement
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">5-6 Points</span>
                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">Average</Badge>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Average, adequate quality with balanced strengths and weaknesses
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">1-4 Points</span>
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">Below Average</Badge>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Below average to poor quality with significant issues requiring attention
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}