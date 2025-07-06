'use client';

import { AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Users, BarChart3, FileText, Brain, Scale } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Navigation } from '@/components/navigation';

export default function FindingsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Navigation />
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">Key Findings & Insights</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Comprehensive analysis of benchmark results reveals valuable insights about model performance, 
          instruction following capabilities, and evaluation methodology considerations.
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
              <div className="text-3xl font-bold text-blue-600">7</div>
              <div className="text-sm text-muted-foreground">Models Evaluated</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">605</div>
              <div className="text-sm text-muted-foreground">Total Samples</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">80.6%</div>
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
            Performance Insights
          </CardTitle>
          <CardDescription>
            Key findings about model performance and capabilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* GPT-4.5 Analysis */}
          <Alert>
            <Brain className="h-4 w-4" />
            <AlertTitle>GPT-4.5 Performance & Judge Sensitivity</AlertTitle>
            <AlertDescription>
              <div className="mt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Overall Score:</span>
                  <Badge variant="outline">7.334 / 10</Badge>
                </div>
                <p className="text-sm">
                  GPT-4.5 achieved the highest score with relatively low judge disagreement (0.588 std). 
                  However, smaller judge models may struggle to appreciate nuanced quality improvements in text from much larger, more sophisticated models.
                  Score vs best open model (Gemma 3 12B): <strong>+0.088 points</strong>
                </p>
                <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                  <div>
                    <div className="font-medium">Narrative</div>
                    <div className="text-muted-foreground">7.57</div>
                  </div>
                  <div>
                    <div className="font-medium">Creativity</div>
                    <div className="text-muted-foreground">7.39</div>
                  </div>
                  <div>
                    <div className="font-medium">Character</div>
                    <div className="text-muted-foreground">6.85</div>
                  </div>
                  <div>
                    <div className="font-medium">Prose</div>
                    <div className="text-muted-foreground">7.37</div>
                  </div>
                  <div>
                    <div className="font-medium">Engagement</div>
                    <div className="text-muted-foreground">7.54</div>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Model Ranking */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Model Performance Ranking</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-green-100 dark:bg-green-900">1st</Badge>
                  <span className="font-medium">GPT-4.5</span>
                  <span className="text-sm text-red-600">(5 samples only)</span>
                </div>
                <span className="font-bold">7.334</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900">2nd</Badge>
                  <span className="font-medium">Gemma 3 12B</span>
                  <span className="text-sm text-green-600">(100 samples)</span>
                </div>
                <span className="font-bold">7.246</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-950 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">3rd</Badge>
                  <span className="font-medium">Mistral Small 24B</span>
                </div>
                <span className="font-bold">6.465</span>
              </div>
            </div>
          </div>

          {/* Instruction Following Insights */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Instruction Following as Quality Metric
            </h3>
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <p className="text-sm mb-3">
                Word count compliance provides a valuable, objective measure of instruction following capability - 
                a crucial aspect of model quality often overlooked in other benchmarks.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="font-medium">Gemma 3 12B:</span>
                    <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">99% compliance</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">GPT-4.5:</span>
                    <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">100% compliance</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Mistral Small:</span>
                    <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300">81% compliance</Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="font-medium">Mistral Nemo:</span>
                    <Badge variant="outline" className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300">43% compliance</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Other models:</span>
                    <Badge variant="outline" className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">8-30% compliance</Badge>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Strong correlation between instruction following and overall quality scores suggests this metric captures important model capabilities.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sampling Strategy Insights */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Sampling Strategy Analysis - Core Findings
          </CardTitle>
          <CardDescription>
            Do sampling parameters really make a significant difference? The data reveals surprising insights.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <BarChart3 className="h-4 w-4" />
            <AlertTitle>Minimal Impact of Sampling Strategies</AlertTitle>
            <AlertDescription>
              <div className="mt-2">
                <p className="text-sm mb-3">
                  Across 600+ samples, different sampling strategies showed surprisingly small performance differences:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950 rounded">
                    <span className="font-medium text-sm">Standard Min-p</span>
                    <span className="font-bold">5.559</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-950 rounded">
                    <span className="font-medium text-sm">Creative Sigma</span>
                    <span className="font-bold">5.487</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-950 rounded">
                    <span className="font-medium text-sm">Model Default</span>
                    <span className="font-bold">5.325</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-950 rounded">
                    <span className="font-medium text-sm">Creative Min-p</span>
                    <span className="font-bold">5.191</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-950 rounded">
                    <span className="font-medium text-sm">Standard Sigma</span>
                    <span className="font-bold">5.160</span>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <p className="text-sm">
                    <strong>Key Insight:</strong> Only 0.4 points separate the best and worst sampling strategies (5.559 vs 5.160). 
                    This suggests that model architecture and training have far more impact on creative writing quality than sampling parameters.
                  </p>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Practical Implications</h4>
              <ul className="text-sm space-y-1">
                <li>• Focus on model selection over sampling tuning</li>
                <li>• Default settings often perform nearly as well</li>
                <li>• Diminishing returns from complex sampling</li>
                <li>• Computational resources better spent elsewhere</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Sampling Strategy Performance</h4>
              <p className="text-sm text-muted-foreground mb-2">Range: 5.16 - 5.56 (0.4 point spread)</p>
              <div className="text-xs space-y-1">
                <div>Min-p methods: Slight edge</div>
                <div>Sigma methods: Middle performance</div>
                <div>Defaults: Competitive baseline</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Methodological Considerations */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Evaluation Methodology & Judge Considerations
          </CardTitle>
          <CardDescription>
            Understanding the capabilities and limitations of our multi-judge evaluation system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Brain className="h-4 w-4" />
            <AlertTitle>Judge Model Capabilities & Limitations</AlertTitle>
            <AlertDescription>
              <div className="mt-2 space-y-2">
                <p>Our multi-judge system reveals important insights about automated evaluation:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li><strong>Subjective Criteria:</strong> Higher disagreement on creative aspects (creativity: 1.32 std, character voice: 1.31 std) reflects the inherent subjectivity of these dimensions</li>
                  <li><strong>Objective Criteria:</strong> Better consensus on structural elements (narrative structure: 0.80 std)</li>
                  <li><strong>Judge Sophistication:</strong> Smaller judge models may not fully appreciate nuances in very high-quality text from advanced models like GPT-4.5</li>
                </ul>
                <p className="text-xs mt-2">Average consensus: 80.6% - reasonable for creative writing evaluation</p>
              </div>
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Multi-Judge System Benefits
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>GPT-4.1 Nano:</span>
                  <span className="font-medium">7.102 ± 0.811</span>
                </div>
                <div className="flex justify-between">
                  <span>Gemini 2.0 Flash:</span>
                  <span className="font-medium">5.675 ± 1.512</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Different judge perspectives provide robustness against single-model evaluation bias. Systematic differences reveal judge characteristics.
                </p>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Consensus Insights</h4>
              <div className="text-sm">
                <div className="mb-2">
                  <div className="font-medium">Average Consensus: 80.6%</div>
                  <div className="text-muted-foreground">Healthy disagreement on subjective criteria</div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Creative writing evaluation naturally involves subjectivity. Multi-judge consensus provides more reliable assessment than single evaluations.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Quality and Insights */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Data Quality & Model Behavior Insights
          </CardTitle>
          <CardDescription>
            Understanding model compliance patterns and statistical considerations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <BarChart3 className="h-4 w-4" />
            <AlertTitle>Instruction Following Analysis</AlertTitle>
            <AlertDescription>
              <div className="mt-2">
                <p className="mb-3">Word count compliance reveals significant differences in instruction following capabilities:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Qwen 3 8B:</span>
                      <span className="text-red-600 font-medium">100% violations</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Llama 3.1 8B:</span>
                      <span className="text-red-600 font-medium">92% violations</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ministral 8B:</span>
                      <span className="text-red-600 font-medium">70% violations</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Mistral Nemo 12B:</span>
                      <span className="text-orange-600 font-medium">57% violations</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mistral Small 24B:</span>
                      <span className="text-orange-600 font-medium">19% violations</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gemma 3 12B:</span>
                      <span className="text-green-600 font-medium">1% violations</span>
                    </div>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Statistical Considerations</AlertTitle>
            <AlertDescription>
              <div className="mt-2">
                <p>Sample size differences provide insights but require careful interpretation:</p>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="font-medium text-orange-600">GPT-4.5: 5 samples</div>
                    <div className="text-muted-foreground">Limited statistical power, but consistent high quality</div>
                  </div>
                  <div>
                    <div className="font-medium text-green-600">Open models: 100 samples each</div>
                    <div className="text-muted-foreground">Robust statistical foundation</div>
                  </div>
                </div>
                <p className="text-xs mt-2">GPT-4.5&apos;s low variance (0.155 std) suggests consistent quality across samples</p>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>


      {/* Conclusions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Conclusions & Benchmark Value
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-950">
              <h4 className="font-semibold text-green-700 dark:text-green-300">Key Valuable Insights</h4>
              <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                <li>Instruction following capability varies dramatically between models - a crucial quality metric</li>
                <li>Gemma 3 12B demonstrates most consistent high-quality performance among open models</li>
                <li>Model architecture appears more important than sampling strategy for creative quality</li>
                <li>Multi-judge evaluation provides robust assessment and reveals inherent subjectivity in creative tasks</li>
                <li>Strong correlation between instruction compliance and overall quality validates this objective metric</li>
              </ul>
            </div>

            <div className="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950">
              <h4 className="font-semibold text-blue-700 dark:text-blue-300">Benchmark Strengths</h4>
              <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                <li>Multi-judge consensus provides more reliable evaluation than single assessments</li>
                <li>Objective instruction following metric complements subjective quality assessment</li>
                <li>Hardware-agnostic focus on quality rather than speed provides practical insights</li>
                <li>Creative writing tasks test nuanced language capabilities beyond standard benchmarks</li>
                <li>Transparent methodology allows for informed interpretation of results</li>
              </ul>
            </div>

            <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
              <h4 className="font-semibold text-yellow-700 dark:text-yellow-300">Methodological Considerations</h4>
              <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                <li>Judge models may not fully appreciate nuances in very high-quality text from advanced models</li>
                <li>Creative writing evaluation naturally involves subjectivity - 80.6% consensus is reasonable</li>
                <li>Sample size differences require careful statistical interpretation</li>
                <li>Results complement rather than replace human evaluation for critical applications</li>
              </ul>
            </div>
          </div>

          <Separator />

          <div className="text-center text-sm text-muted-foreground">
            <p>
              This benchmark provides valuable insights into model capabilities, instruction following, and creative quality. 
              Results should be interpreted alongside methodological considerations for optimal decision-making.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}