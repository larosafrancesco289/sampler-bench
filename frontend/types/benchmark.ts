export interface CriterionScore {
  criterion: string;
  score: number;
  reasoning: string;
}

export interface Judgment {
  overall_score: number;
  criterion_scores: CriterionScore[];
  summary: string;
  evaluation_time: number;
  model_used: string;
  judged_at: string;
}

export interface Sample {
  sample_id: number;
  prompt: string;
  sampler_name: string;
  sampler_config: Record<string, any>;
  generated_text: string;
  word_count: number;
  timestamp: string;
  judgment: Judgment;
}

export interface SamplerConfig {
  description: string;
  sampler: string;
  parameters: Record<string, any>;
}

export interface ModelConfig {
  name: string;
  path: string;
  context_length: number;
  quantization: string;
  inference_engine: string;
  template: string;
  port: number;
  gpu_layers: number;
  parameters: Record<string, any>;
}

export interface BenchmarkResults {
  benchmark_name: string;
  timestamp: string;
  model_name: string;
  model_config: ModelConfig;
  prompts: string[];
  sampler_configs: Record<string, SamplerConfig>;
  samples: Sample[];
}

export interface LeaderboardEntry {
  sampler_name: string;
  average_score: number;
  total_samples: number;
  criteria_breakdown: Record<string, number>;
  description: string;
  parameters: Record<string, any>;
  avg_word_count: number;
} 