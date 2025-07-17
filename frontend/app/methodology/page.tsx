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
          How we evaluate LLM sampling strategies for creative writing
        </p>
      </div>

      {/* Overview Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Overview
          </CardTitle>
          <CardDescription>
            Comparing 5 sampling strategies across multiple models using LLM judges
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed">
            This benchmark generates creative writing samples using different sampling strategies, then evaluates them 
            using multiple LLM judges. We focus on 5 proven sampling methods across various models, with 20 samples 
            per strategy to ensure statistical reliability.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">5 Sampling Methods</Badge>
            <Badge variant="secondary">20 Samples Each</Badge>
            <Badge variant="secondary">Multi-Judge Evaluation</Badge>
            <Badge variant="secondary">Creative Writing Focus</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Process Overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Process
          </CardTitle>
          <CardDescription>How samples are generated and evaluated</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Generation</h4>
              <div className="space-y-3">
                <div>
                  <h5 className="font-medium mb-1">Model Setup</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Local inference using KoboldCpp server
                  </p>
                </div>
                <div>
                  <h5 className="font-medium mb-1">Sampling</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    20 samples per strategy using 5 creative writing prompts (4 repetitions each)
                  </p>
                </div>
                <div>
                  <h5 className="font-medium mb-1">Target Length</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    300-400 words per story with compliance scoring
                  </p>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">Evaluation</h4>
              <div className="space-y-3">
                <div>
                  <h5 className="font-medium mb-1">Judge Models</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    GPT-4.1-nano and Gemini-2.0-flash via OpenRouter
                  </p>
                </div>
                <div>
                  <h5 className="font-medium mb-1">Consensus Scoring</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Multiple judges evaluate each sample, scores averaged with reliability metrics
                  </p>
                </div>
                <div>
                  <h5 className="font-medium mb-1">Quality Control</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Penalties for word count violations (-1.5), meta-commentary (-0.8), failed generation (-3.0)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quality Criteria */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Quality Evaluation Criteria
          </CardTitle>
          <CardDescription>
            Why these metrics matter for creative writing evaluation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm">
              <strong>Rationale:</strong> Creative writing quality is multifaceted and subjective. We use structured criteria 
              to make evaluation more consistent and transparent. These dimensions capture the key elements that differentiate 
              good from poor creative writing, as validated by creative writing pedagogy and literary criticism.
            </p>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Core Evaluation Dimensions</h3>
              
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">Narrative Structure</h4>
                    <Badge variant="outline" className="text-xs">30%</Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    <strong>What it measures:</strong> Story organization, pacing, plot coherence, and logical progression. 
                    Does the story have a clear beginning, middle, and end? Are events well-sequenced?
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <strong>Why it matters:</strong> Fundamental to readable fiction. Poor structure confuses readers and 
                    undermines other story elements. Highest weight because it's essential for story comprehension.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">Creativity Execution</h4>
                    <Badge variant="outline" className="text-xs">25%</Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    <strong>What it measures:</strong> Originality of ideas, creative premise handling, and unexpected elements. 
                    Does the story offer fresh perspectives or novel approaches?
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <strong>Why it matters:</strong> Distinguishes memorable from forgettable writing. Creative stories engage 
                    readers more effectively and demonstrate the model's ability to generate novel content.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">Character Voice</h4>
                    <Badge variant="outline" className="text-xs">20%</Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    <strong>What it measures:</strong> Character development, authentic dialogue, and distinct character voices. 
                    Are characters believable and well-developed within the story's scope?
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <strong>Why it matters:</strong> Characters drive reader engagement. Strong character voices indicate 
                    sophisticated language modeling and understanding of human psychology.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">Prose Quality</h4>
                    <Badge variant="outline" className="text-xs">15%</Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    <strong>What it measures:</strong> Writing craft, style, sentence variety, and language use. 
                    Is the prose well-crafted and pleasant to read?
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <strong>Why it matters:</strong> Technical writing quality affects readability and aesthetic appeal. 
                    Shows the model's mastery of language mechanics and stylistic variation.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">Engagement</h4>
                    <Badge variant="outline" className="text-xs">10%</Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    <strong>What it measures:</strong> Reader interest and emotional impact. Does the story hold attention 
                    and evoke emotional responses?
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <strong>Why it matters:</strong> Ultimate goal of creative writing. Lower weight because it's the most 
                    subjective criterion and often emerges from the other dimensions.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <h4 className="font-medium mb-2">Judge Models</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <strong>GPT-4.1-nano and Gemini-2.0-flash:</strong> Selected for their strong performance on creative tasks 
                and ability to provide detailed, structured feedback. Multiple judges reduce individual model bias.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Core Sampling Strategies */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Sampling Strategies
          </CardTitle>
          <CardDescription>
            The 5 sampling methods we compare in this benchmark
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