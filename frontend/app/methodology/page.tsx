"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { Target, BarChart, Settings, Zap, ChevronDown } from "lucide-react"
import { useState } from "react"

export default function MethodologyPage() {
  const [isPromptsOpen, setIsPromptsOpen] = useState(false)
  
  return (
    <div className="container mx-auto py-6 sm:py-8 px-3 sm:px-4">
      <Navigation />
      <div className="mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold text-fg mb-1 sm:mb-2">
          Benchmark Methodology
        </h1>
        <p className="text-sm sm:text-lg text-fg-muted">
          How we evaluate LLM sampling strategies for creative writing, and how we compute MMLU accuracy
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
            Comparing 5 sampling strategies across multiple models using LLM judges (writing) and objective accuracy (MMLU)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed">
            This benchmark generates creative writing samples using different sampling strategies, then evaluates them 
            using multiple LLM judges. We focus on 5 proven sampling methods across various models, with 20 samples 
            per strategy to ensure statistical reliability.
            In addition, the MMLU-Pro subset runner prompts the model to output only a single letter choice per question. Accuracy is computed directly from letter matches.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">5 Sampling Methods</Badge>
            <Badge variant="secondary">20 Samples Each</Badge>
            <Badge variant="secondary">Cross-Cultural Multi-Judge (Writing)</Badge>
            <Badge variant="secondary">Objective Accuracy (MMLU)</Badge>
            <Badge variant="secondary">Creative Writing Focus</Badge>
            <Badge variant="secondary">Instruction Following Tracking</Badge>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h4 className="font-medium mb-3">Generation</h4>
             <div className="space-y-3">
                <div>
                  <h5 className="font-medium mb-1">Model Setup</h5>
                   <p className="text-xs sm:text-sm text-fg-muted">
                    Local inference using KoboldCpp server
                  </p>
                </div>
                <div>
                  <h5 className="font-medium mb-1">Sampling</h5>
                   <p className="text-xs sm:text-sm text-fg-muted">
                    20 samples per strategy using 5 creative writing prompts (4 repetitions each)
                  </p>
                </div>
                <div>
                  <h5 className="font-medium mb-1">Target Length</h5>
                   <p className="text-xs sm:text-sm text-fg-muted">
                    300-400 words per story with compliance scoring
                  </p>
                </div>
                <div>
                  <h5 className="font-medium mb-1">MMLU Mode</h5>
                  <p className="text-xs sm:text-sm text-fg-muted">
                    Multiple-choice questions where the model outputs a single letter only; answers are judged correct/incorrect without LLM judges.
                  </p>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">Evaluation</h4>
              <div className="space-y-3">
                <div>
                  <h5 className="font-medium mb-1">Judge Models</h5>
                   <p className="text-xs sm:text-sm text-fg-muted">
                    Kimi-K2 (Chinese) and Mistral Medium 3 (European) leading open-weight models
                  </p>
                </div>
                <div>
                  <h5 className="font-medium mb-1">Consensus Scoring</h5>
                   <p className="text-xs sm:text-sm text-fg-muted">
                    Multiple judges evaluate each sample, scores averaged with reliability metrics
                  </p>
                </div>
                <div>
                  <h5 className="font-medium mb-1">Quality Control</h5>
                   <p className="text-xs sm:text-sm text-fg-muted">
                    Word count compliance tracking (300-400 words), instruction following analysis, generation failure detection
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
           <div className="mb-6 p-4 bg-muted rounded-lg">
            <p className="text-xs sm:text-sm">
              <strong>Rationale:</strong> Creative writing quality is multifaceted and subjective. We use structured criteria 
              to make evaluation more consistent and transparent. These dimensions capture the key elements that differentiate 
              good from poor creative writing. The specific judging prompts and criteria implementations can be found in the 
              backend evaluation pipeline at <code>backend/evaluation/llm_judge.py</code>.
            </p>
          </div>

          {/* Judging Prompts Dropdown */}
          <div className="mt-6">
              <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => setIsPromptsOpen(!isPromptsOpen)}
            >
              View Actual Judging Prompts Used in Pipeline
              <ChevronDown className={`h-4 w-4 transition-transform ${isPromptsOpen ? 'rotate-180' : ''}`} />
            </Button>
            
            {isPromptsOpen && (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">System Prompt</h4>
                  <pre className="text-[11px] sm:text-xs text-fg-muted whitespace-pre-wrap overflow-x-auto">
{`You are an expert literary critic and creative writing evaluator. Your task is to objectively assess creative writing samples based on specific criteria.

You will evaluate texts on a 1-10 scale for each criterion, where:
- 1-2: Poor quality with major issues
- 3-4: Below average with notable problems  
- 5-6: Average quality, adequate but unremarkable
- 7-8: Good quality with strong elements
- 9-10: Excellent quality, exceptional work

Be objective, consistent, and provide specific reasoning for your scores. Focus on the writing quality rather than personal preferences about content or themes.

Respond ONLY in the specified JSON format with no additional text.`}
                  </pre>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Evaluation Criteria (with weights)</h4>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span><strong>Narrative Coherence:</strong> How well the story flows and maintains logical consistency</span>
                      <Badge variant="outline">25%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span><strong>Creativity Originality:</strong> Uniqueness of ideas, plot elements, and creative expression</span>
                      <Badge variant="outline">25%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span><strong>Character Development:</strong> Depth and believability of characters and their development</span>
                      <Badge variant="outline">20%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span><strong>Engagement Readability:</strong> How engaging and readable the text is for the audience</span>
                      <Badge variant="outline">20%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span><strong>Stylistic Quality:</strong> Writing style, language use, and literary technique</span>
                      <Badge variant="outline">10%</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">User Prompt Template</h4>
                   <pre className="text-[11px] sm:text-xs text-fg-muted whitespace-pre-wrap overflow-x-auto">
{`**TASK**: Evaluate the following creative writing sample based on the specified criteria.

**ORIGINAL PROMPT**: [Original writing prompt]

**GENERATED TEXT**:
[Generated text to evaluate]

**SAMPLING CONFIGURATION**: [Temperature and sampler info]

**EVALUATION CRITERIA**:
- **Narrative Coherence**: How well the story flows and maintains logical consistency
- **Creativity Originality**: Uniqueness of ideas, plot elements, and creative expression
- **Character Development**: Depth and believability of characters and their development
- **Engagement Readability**: How engaging and readable the text is for the audience
- **Stylistic Quality**: Writing style, language use, and literary technique

**INSTRUCTIONS**: 
1. Score each criterion on a 1-10 scale
2. Provide specific reasoning for each score
3. Calculate an overall weighted score
4. Give a brief summary assessment

**REQUIRED JSON RESPONSE FORMAT**:
{
    "criterion_scores": {
        "narrative_coherence": {"score": X.X, "reasoning": "detailed explanation"},
        "creativity_originality": {"score": X.X, "reasoning": "detailed explanation"},
        "character_development": {"score": X.X, "reasoning": "detailed explanation"},
        "engagement_readability": {"score": X.X, "reasoning": "detailed explanation"},
        "stylistic_quality": {"score": X.X, "reasoning": "detailed explanation"}
    },
    "overall_score": X.X,
    "summary": "Brief 2-3 sentence assessment of the text&apos;s overall quality and notable strengths/weaknesses"
}`}
                  </pre>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-6 mt-8">
            <div>
               <h3 className="font-semibold mb-3 sm:mb-4">Core Evaluation Dimensions</h3>
              
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">Narrative Structure</h4>
                    <Badge variant="outline" className="text-xs">30%</Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-fg-muted mb-2">
                    <strong>What it measures:</strong> Story organization, pacing, plot coherence, and logical progression. 
                    Does the story have a clear beginning, middle, and end? Are events well-sequenced?
                  </p>
                   <p className="text-xs sm:text-sm text-fg-muted">
                    <strong>Why it matters:</strong> Fundamental to readable fiction. Poor structure confuses readers and 
                    undermines other story elements. Highest weight because it&apos;s essential for story comprehension.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">Creativity Execution</h4>
                    <Badge variant="outline" className="text-xs">25%</Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-fg-muted mb-2">
                    <strong>What it measures:</strong> Originality of ideas, creative premise handling, and unexpected elements. 
                    Does the story offer fresh perspectives or novel approaches?
                  </p>
                  <p className="text-xs sm:text-sm text-fg-muted">
                    <strong>Why it matters:</strong> Distinguishes memorable from forgettable writing. Creative stories engage 
                    readers more effectively and demonstrate the model&apos;s ability to generate novel content.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">Character Voice</h4>
                    <Badge variant="outline" className="text-xs">20%</Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-fg-muted mb-2">
                    <strong>What it measures:</strong> Character development, authentic dialogue, and distinct character voices. 
                    Are characters believable and well-developed within the story&apos;s scope?
                  </p>
                  <p className="text-xs sm:text-sm text-fg-muted">
                    <strong>Why it matters:</strong> Characters drive reader engagement. Strong character voices indicate 
                    sophisticated language modeling and understanding of human psychology.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">Prose Quality</h4>
                    <Badge variant="outline" className="text-xs">15%</Badge>
                  </div>
                  <p className="text-sm text-fg-muted mb-2">
                    <strong>What it measures:</strong> Writing craft, style, sentence variety, and language use. 
                    Is the prose well-crafted and pleasant to read?
                  </p>
                  <p className="text-sm text-fg-muted">
                    <strong>Why it matters:</strong> Technical writing quality affects readability and aesthetic appeal. 
                    Shows the model&apos;s mastery of language mechanics and stylistic variation.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">Engagement</h4>
                    <Badge variant="outline" className="text-xs">10%</Badge>
                  </div>
                  <p className="text-sm text-fg-muted mb-2">
                    <strong>What it measures:</strong> Reader interest and emotional impact. Does the story hold attention 
                    and evoke emotional responses?
                  </p>
                  <p className="text-sm text-fg-muted">
                    <strong>Why it matters:</strong> Ultimate goal of creative writing. Lower weight because it&apos;s the most 
                    subjective criterion and often emerges from the other dimensions.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
               <h4 className="font-medium mb-2">Judge Models (Writing)</h4>
              <p className="text-xs sm:text-sm text-fg-muted">
                <strong>Kimi-K2 (Chinese) and Mistral Medium 3 (European):</strong> Leading open-weight models from different cultural backgrounds, 
                selected for their strong creative writing evaluation capabilities and cross-cultural perspective diversity. 
                Multiple judges reduce individual model bias while providing culturally diverse evaluation viewpoints.
              </p>
              <div className="mt-3 text-[11px] sm:text-xs text-fg-muted">
                 <strong>Judge Agreement:</strong> These models have demonstrated high consensus strength in testing, 
                indicating excellent cross-cultural reliability in creative writing evaluation.
              </div>
            </div>
             <div className="p-4 bg-muted rounded-lg">
               <h4 className="font-medium mb-2">MMLU Scoring</h4>
               <p className="text-xs sm:text-sm text-fg-muted">
                 For MMLU, we compute accuracy per sampler and model as the fraction of correct letter responses over the subset. No judges are used.
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
                <p className="text-xs text-fg-muted">
                  Dynamically resolves to model-specific optimal settings (Llama: temp 0.6, top_p 0.9; Mistral Small: temp 0.15; etc.)
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">standard_minp</h4>
                  <Badge variant="outline" className="text-xs">temp 0.7, min_p 0.02</Badge>
                </div>
                <p className="text-xs text-fg-muted">
                  Min-p sampling with conservative temperature 0.7 and min_p threshold 0.02
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">creative_minp</h4>
                  <Badge variant="outline" className="text-xs">temp 1.0, min_p 0.02</Badge>
                </div>
                <p className="text-xs text-fg-muted">
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
                <p className="text-xs text-fg-muted">
                  Top-n-sigma sampling with high temperature 1.5 and standard deviation threshold 1.0
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">creative_sigma</h4>
                  <Badge variant="outline" className="text-xs">temp 1.0, σ 1.5</Badge>
                </div>
                  <p className="text-xs text-fg-muted">
                  Top-n-sigma sampling with moderate temperature 1.0 and relaxed sigma threshold 1.5
                </p>
              </div>

            </div>
          </div>
        </CardContent>
      </Card>


      {/* Instruction Following */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Instruction Following Analysis
          </CardTitle>
          <CardDescription>
            How we measure model compliance with specific instructions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Word Count Compliance</h4>
              <p className="text-sm text-fg-muted">
                Each prompt specifies exactly 300-400 words. We track compliance rates as an objective measure 
                of instruction following capability. High compliance indicates better instruction adherence.
              </p>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Methodology Approach</h4>
              <p className="text-sm text-fg-muted mb-3">
                Rather than applying score penalties, we use compliance metrics for analysis and reporting. 
                This preserves the natural quality scores while providing clear visibility into instruction following patterns.
              </p>
              <div className="text-xs text-fg-muted space-y-1">
                <div><strong>Tracked Metrics:</strong></div>
                <div>• Word count compliance percentage per model/sampler</div>
                <div>• Average word count deviation from target range</div>
                <div>• Instruction following consistency across samples</div>
                <div>• Generation failure rates and meta-commentary detection</div>
              </div>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Why This Matters</h4>
              <p className="text-sm text-fg-muted">
                Instruction following correlates with model reliability and real-world usability. Models with 
                higher compliance rates typically perform better across quality dimensions, suggesting that 
                instruction adherence is a fundamental capability indicator.
              </p>
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
                <Badge variant="secondary">Exceptional</Badge>
              </div>
              <p className="text-xs text-fg-muted">
                Exceptional creative writing with outstanding quality across all criteria
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">7-8 Points</span>
                <Badge variant="secondary">Good</Badge>
              </div>
              <p className="text-xs text-fg-muted">
                Good quality writing with strong elements and minor areas for improvement
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">5-6 Points</span>
                <Badge variant="secondary">Average</Badge>
              </div>
              <p className="text-xs text-fg-muted">
                Average, adequate quality with balanced strengths and weaknesses
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">1-4 Points</span>
                <Badge variant="secondary">Below Average</Badge>
              </div>
              <p className="text-xs text-fg-muted">
                Below average to poor quality with significant issues requiring attention
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}