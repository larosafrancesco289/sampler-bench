"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GlassPanel } from "@/components/observatory/glass-panel"
import { ProbabilityBackdrop, CurveDivider } from "@/components/observatory/probability-backdrop"
import {
  Target,
  BarChart3,
  Settings,
  Zap,
  ChevronDown,
  Scale,
  BookOpen,
  Gauge,
  Activity,
  FileText,
  CheckCircle
} from "lucide-react"

const criteriaData = [
  {
    name: "Narrative Coherence",
    weight: "25%",
    description: "How well the story flows and maintains logical consistency throughout the narrative arc."
  },
  {
    name: "Creativity & Originality",
    weight: "25%",
    description: "Uniqueness of ideas, plot elements, and creative expression that distinguishes the work."
  },
  {
    name: "Character Development",
    weight: "20%",
    description: "Depth and believability of characters, their motivations, and growth within the story."
  },
  {
    name: "Engagement & Readability",
    weight: "20%",
    description: "How engaging and accessible the text is for readers, maintaining interest throughout."
  },
  {
    name: "Stylistic Quality",
    weight: "10%",
    description: "Writing style, language use, sentence variety, and literary technique mastery."
  }
]

const samplerStrategies = [
  {
    name: "model_default",
    icon: <Settings className="w-5 h-5" />,
    badge: "Dynamic",
    description: "Resolves to model-specific optimal settings (e.g., Llama: temp 0.6, top_p 0.9)"
  },
  {
    name: "standard_minp",
    icon: <Gauge className="w-5 h-5" />,
    badge: "temp 0.7, min_p 0.02",
    description: "Conservative min-p sampling with lower temperature for controlled creativity"
  },
  {
    name: "creative_minp",
    icon: <Gauge className="w-5 h-5" />,
    badge: "temp 1.0, min_p 0.02",
    description: "Moderate min-p sampling with standard temperature for balanced output"
  },
  {
    name: "standard_sigma",
    icon: <Activity className="w-5 h-5" />,
    badge: "temp 1.5, σ 1.0",
    description: "Top-nσ with high temperature and tight deviation threshold"
  },
  {
    name: "creative_sigma",
    icon: <Activity className="w-5 h-5" />,
    badge: "temp 1.0, σ 1.5",
    description: "Top-nσ with moderate temperature and relaxed sigma threshold"
  }
]

const scoreInterpretation = [
  { range: "9-10", label: "Exceptional", color: "text-accent", description: "Outstanding creative writing with excellence across all criteria" },
  { range: "7-8", label: "Good", color: "text-fg", description: "Strong writing with minor areas for improvement" },
  { range: "5-6", label: "Average", color: "text-fg-muted", description: "Adequate quality with balanced strengths and weaknesses" },
  { range: "1-4", label: "Below Average", color: "text-fg-subtle", description: "Significant issues requiring attention" }
]

export default function MethodologyPage() {
  const [isPromptsOpen, setIsPromptsOpen] = useState(false)

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-6 md:py-10">
        <ProbabilityBackdrop variant="subtle" className="opacity-30" />

        <div className="container relative z-10">
          <Navigation />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <Badge variant="accent" className="mb-4">Documentation</Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl text-fg mb-4">
              Methodology
            </h1>
            <p className="text-lg md:text-xl text-fg-muted leading-relaxed">
              How we evaluate LLM sampling strategies through creative writing quality
              and MMLU-Pro accuracy benchmarks.
            </p>
          </motion.div>
        </div>
      </section>

      <CurveDivider className="opacity-30" />

      {/* Quick Overview Stats */}
      <section className="py-12 md:py-16">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
          >
            {[
              { value: "5", label: "Sampling Strategies" },
              { value: "20", label: "Samples Per Strategy" },
              { value: "2", label: "LLM Judges" },
              { value: "5", label: "Quality Criteria" }
            ].map((stat, index) => (
              <GlassPanel
                key={stat.label}
                variant={index === 0 ? "accent" : "default"}
                className="text-center py-6"
              >
                <p className="text-3xl md:text-4xl font-display text-fg mb-1">{stat.value}</p>
                <p className="text-xs md:text-sm text-fg-muted">{stat.label}</p>
              </GlassPanel>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-12 md:py-16 border-t border-border-subtle">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-8">
              <Settings className="w-6 h-6 text-accent" />
              <h2 className="text-2xl md:text-3xl text-fg">Evaluation Process</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Generation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-accent" />
                    Generation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-surface-elevated/50 border border-border-subtle">
                      <h4 className="font-medium text-fg text-sm mb-1">Model Setup</h4>
                      <p className="text-xs text-fg-muted">Local inference using KoboldCpp server</p>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-elevated/50 border border-border-subtle">
                      <h4 className="font-medium text-fg text-sm mb-1">Sampling</h4>
                      <p className="text-xs text-fg-muted">20 samples per strategy using 5 creative prompts (4 reps each)</p>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-elevated/50 border border-border-subtle">
                      <h4 className="font-medium text-fg text-sm mb-1">Target Length</h4>
                      <p className="text-xs text-fg-muted">300-400 words per story with compliance scoring</p>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-elevated/50 border border-border-subtle">
                      <h4 className="font-medium text-fg text-sm mb-1">MMLU Mode</h4>
                      <p className="text-xs text-fg-muted">Multiple-choice with single letter answers, exact match scoring</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Evaluation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="w-5 h-5 text-accent" />
                    Evaluation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-surface-elevated/50 border border-border-subtle">
                      <h4 className="font-medium text-fg text-sm mb-1">Judge Models</h4>
                      <p className="text-xs text-fg-muted">Kimi-K2 (Chinese) and Mistral Medium 3 (European)</p>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-elevated/50 border border-border-subtle">
                      <h4 className="font-medium text-fg text-sm mb-1">Consensus Scoring</h4>
                      <p className="text-xs text-fg-muted">Multiple judges evaluate each sample, scores averaged</p>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-elevated/50 border border-border-subtle">
                      <h4 className="font-medium text-fg text-sm mb-1">Quality Control</h4>
                      <p className="text-xs text-fg-muted">Word count compliance, instruction following analysis</p>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-elevated/50 border border-border-subtle">
                      <h4 className="font-medium text-fg text-sm mb-1">MMLU Accuracy</h4>
                      <p className="text-xs text-fg-muted">Fraction of correct responses, no judges needed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quality Criteria */}
      <section className="py-12 md:py-16 border-t border-border-subtle">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-8">
              <BarChart3 className="w-6 h-6 text-accent" />
              <h2 className="text-2xl md:text-3xl text-fg">Quality Criteria</h2>
            </div>

            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {criteriaData.map((criterion, index) => (
                    <motion.div
                      key={criterion.name}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-4 p-4 rounded-xl bg-surface-elevated/50 border border-border-subtle"
                    >
                      <Badge variant="outline" className="shrink-0 mt-0.5">
                        {criterion.weight}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-fg mb-1">{criterion.name}</h4>
                        <p className="text-sm text-fg-muted">{criterion.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Judging Prompts Expandable */}
            <Card>
              <CardHeader className="cursor-pointer" onClick={() => setIsPromptsOpen(!isPromptsOpen)}>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-accent" />
                    Judging Prompt Details
                  </div>
                  <motion.div
                    animate={{ rotate: isPromptsOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-5 h-5 text-fg-muted" />
                  </motion.div>
                </CardTitle>
                <CardDescription>
                  View the actual prompts used in the evaluation pipeline
                </CardDescription>
              </CardHeader>

              <AnimatePresence>
                {isPromptsOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <CardContent className="pt-0 space-y-4">
                      <div className="p-4 rounded-xl bg-surface border border-border-subtle">
                        <h4 className="font-medium text-fg mb-3">System Prompt</h4>
                        <pre className="text-xs text-fg-muted whitespace-pre-wrap font-mono leading-relaxed">
{`You are an expert literary critic and creative writing evaluator. Your task is to objectively assess creative writing samples based on specific criteria.

You will evaluate texts on a 1-10 scale for each criterion, where:
- 1-2: Poor quality with major issues
- 3-4: Below average with notable problems
- 5-6: Average quality, adequate but unremarkable
- 7-8: Good quality with strong elements
- 9-10: Excellent quality, exceptional work

Be objective, consistent, and provide specific reasoning for your scores.`}
                        </pre>
                      </div>

                      <div className="p-4 rounded-xl bg-surface border border-border-subtle">
                        <h4 className="font-medium text-fg mb-3">Response Format</h4>
                        <pre className="text-xs text-fg-muted whitespace-pre-wrap font-mono leading-relaxed">
{`{
  "criterion_scores": {
    "narrative_coherence": {"score": X.X, "reasoning": "..."},
    "creativity_originality": {"score": X.X, "reasoning": "..."},
    "character_development": {"score": X.X, "reasoning": "..."},
    "engagement_readability": {"score": X.X, "reasoning": "..."},
    "stylistic_quality": {"score": X.X, "reasoning": "..."}
  },
  "overall_score": X.X,
  "summary": "Brief 2-3 sentence assessment"
}`}
                        </pre>
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Sampling Strategies */}
      <section className="py-12 md:py-16 border-t border-border-subtle">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-8">
              <Zap className="w-6 h-6 text-accent" />
              <h2 className="text-2xl md:text-3xl text-fg">Sampling Strategies</h2>
            </div>

            <p className="text-fg-muted mb-6 max-w-2xl">
              The five sampling configurations tested across all models. Each strategy represents
              a different approach to controlling token selection randomness.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {samplerStrategies.map((strategy, index) => (
                <motion.div
                  key={strategy.name}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <GlassPanel
                    variant="default"
                    className="h-full hover:border-border-accent transition-colors duration-200"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-accent/10 text-accent">
                        {strategy.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-mono font-medium text-fg text-sm">{strategy.name}</h4>
                        <Badge variant="outline" size="sm" className="mt-1">{strategy.badge}</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-fg-muted">{strategy.description}</p>
                  </GlassPanel>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Instruction Following */}
      <section className="py-12 md:py-16 border-t border-border-subtle">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-8">
              <Target className="w-6 h-6 text-accent" />
              <h2 className="text-2xl md:text-3xl text-fg">Instruction Following</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Word Count Compliance</CardTitle>
                  <CardDescription>Objective measure of instruction adherence</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-fg-muted">
                    Each prompt specifies exactly 300-400 words. We track compliance rates as an
                    objective measure of instruction following capability. High compliance indicates
                    better instruction adherence.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tracked Metrics</CardTitle>
                  <CardDescription>What we measure for each sample</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-fg-muted">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-accent shrink-0" />
                      Word count compliance percentage
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-accent shrink-0" />
                      Average deviation from target range
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-accent shrink-0" />
                      Instruction following consistency
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-accent shrink-0" />
                      Generation failure detection
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Score Interpretation */}
      <section className="py-12 md:py-16 border-t border-border-subtle">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-8">
              <Scale className="w-6 h-6 text-accent" />
              <h2 className="text-2xl md:text-3xl text-fg">Score Interpretation</h2>
            </div>

            <p className="text-fg-muted mb-6 max-w-2xl">
              Understanding the 1-10 quality scale used for creative writing evaluation.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {scoreInterpretation.map((score, index) => (
                <motion.div
                  key={score.range}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <GlassPanel
                    variant={index === 0 ? "accent" : "default"}
                    className="h-full text-center"
                  >
                    <p className={`text-3xl font-display mb-2 ${score.color}`}>
                      {score.range}
                    </p>
                    <Badge variant={index === 0 ? "default" : "secondary"} className="mb-3">
                      {score.label}
                    </Badge>
                    <p className="text-sm text-fg-muted">{score.description}</p>
                  </GlassPanel>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border-subtle">
        <div className="container text-center text-sm text-fg-subtle">
          <p>Methodology documented for transparency and reproducibility</p>
        </div>
      </footer>
    </div>
  )
}
