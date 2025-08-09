"use client"

import { Badge } from "@/components/ui/badge"
import { LatexMath } from "@/components/latex-math"

interface SamplerExplanationProps {
  sampler: string
  showMath: boolean
}

export function SamplerExplanation({ sampler, showMath }: SamplerExplanationProps) {
  const explanations = {
    temperature: {
      simple: "Temperature controls the randomness of text generation by scaling the logits (raw model outputs) before applying softmax. Lower temperatures make the model more confident and focused, while higher temperatures make it more creative and unpredictable.",
      detailed: "Temperature scaling transforms the probability distribution by dividing each logit by the temperature value. At temperature 1.0, the original distribution is preserved. Lower values (0.1-0.9) make the distribution more peaked, favoring high-probability tokens. Higher values (1.1-3.0) flatten the distribution, giving more chance to lower-probability tokens.",
      math: "P(\\text{token}_i) = \\frac{\\exp(\\text{logit}_i / T)}{\\sum_j \\exp(\\text{logit}_j / T)}",
      mathDescription: "where T is the temperature parameter",
      useCases: ["Creative writing (high T)", "Code generation (low T)", "General conversation (medium T)"],
      pros: ["Simple to understand", "Widely supported", "Good baseline"],
      cons: ["Can become incoherent at high values", "Doesn't adapt to context"]
    },
    top_p: {
      simple: "Top-p (nucleus) sampling selects tokens from the smallest set whose cumulative probability exceeds p. This creates a dynamic vocabulary size that adapts to the model's confidence - when the model is confident, fewer tokens are considered; when uncertain, more tokens are included.",
      detailed: "The algorithm sorts tokens by probability, then includes tokens until their cumulative probability reaches the threshold p. This means the actual number of tokens considered varies based on the distribution shape. In peaked distributions (confident predictions), only a few tokens are needed. In flat distributions (uncertain predictions), many tokens are included.",
      math: "V_p = \\{\\text{token}_i : \\sum_{j=1}^{i} P(\\text{token}_j) \\leq p\\}",
      mathDescription: "where tokens are sorted by descending probability",
      useCases: ["Balanced creativity", "Conversational AI", "Most general-purpose applications"],
      pros: ["Adapts to model confidence", "Prevents very unlikely tokens", "Good balance of quality and diversity"],
      cons: ["Can include too many low-probability tokens", "Performance degrades at high temperatures"]
    },
    top_k: {
      simple: "Top-k sampling considers only the k most likely tokens, filtering out all others. This creates a fixed vocabulary size regardless of the model's confidence level, providing consistent behavior but potentially missing good alternatives when the model is uncertain.",
      detailed: "The algorithm ranks all tokens by probability and keeps only the top k, setting all others to zero probability. Unlike top-p, the vocabulary size is constant, which can be limiting when the model has many good options or too permissive when most options are poor.",
      math: "V_k = \\{\\text{token}_1, \\text{token}_2, \\ldots, \\text{token}_k\\}",
      mathDescription: "where tokens are ranked by P(token_i) in descending order",
      useCases: ["Structured generation", "Code completion", "When consistent vocabulary size is needed"],
      pros: ["Predictable vocabulary size", "Simple to implement", "Fast computation"],
      cons: ["Doesn't adapt to confidence", "May miss good alternatives", "May include poor options"]
    },
    min_p: {
      simple: "Min-p sampling sets a dynamic threshold based on the top token's probability. If the most likely token has probability p_max, then only tokens with probability ≥ min_p × p_max are considered. This adapts to the model's confidence level automatically.",
      detailed: "Min-p addresses the limitations of top-p sampling by using the top token's probability as a reference point. When the model is confident (high p_max), the threshold is high, excluding weak alternatives. When uncertain (low p_max), the threshold is low, including more options. This maintains quality even at high temperatures.",
      math: "V_{\\text{min-p}} = \\{\\text{token}_i : P(\\text{token}_i) \\geq \\alpha \\cdot \\max_j P(\\text{token}_j)\\}",
      mathDescription: "where α is the min_p parameter",
      useCases: ["High-temperature creative writing", "Maintaining coherence with creativity", "Adaptive text generation"],
      pros: ["Maintains quality at high temperatures", "Adapts to model confidence", "Good creativity-coherence balance"],
      cons: ["Newer technique with less tooling support", "Can be too restrictive in some cases"]
    },
    top_n_sigma: {
      simple: "Top-nσ sampling works directly with logits (pre-softmax values) using statistical analysis. It identifies tokens that are n standard deviations above the mean logit value, effectively separating 'signal' tokens from 'noise' tokens based on the natural statistics of the logit distribution.",
      detailed: "The method leverages the observation that logit distributions naturally separate into a Gaussian-distributed background (noise) and prominent outliers (signal). By computing the mean and standard deviation of logits, tokens that are n-sigma above the mean are considered informative. This approach is temperature-invariant and works directly with the model's raw outputs.",
      math: "V_{n\\sigma} = \\{\\text{token}_i : \\ell_i \\geq \\max_j(\\ell_j) - n \\cdot \\sigma(\\ell)\\}",
      mathDescription: "where ℓ are logits and σ(ℓ) is their standard deviation",
      useCases: ["High-temperature generation", "Temperature-invariant sampling", "Maintaining coherence across temperature ranges"],
      pros: ["Temperature invariant", "Statistically principled", "Maintains quality at any temperature", "Simple implementation"],
      cons: ["Very new technique", "Limited empirical validation", "May be too aggressive in filtering"]
    }
  }

  const explanation = explanations[sampler as keyof typeof explanations] as {
    simple: string
    detailed: string
    math: string
    mathDescription?: string
    useCases: string[]
    pros: string[]
    cons: string[]
  }
  
  if (!explanation) {
    return <div>Select a sampler to see its explanation.</div>
  }

  return (
    <div className="space-y-6">
      {/* Simple Explanation */}
      <div>
        <h3 className="font-semibold mb-2">How it works</h3>
      <p className="text-sm text-fg-muted">
          {explanation.simple}
        </p>
      </div>

      {/* Detailed Explanation */}
      <div>
        <h3 className="font-semibold mb-2">Technical Details</h3>
      <p className="text-sm text-fg-muted">
          {explanation.detailed}
        </p>
      </div>

      {/* Mathematical Formula */}
      {showMath && (
        <div>
          <h3 className="font-semibold mb-2">Mathematical Formula</h3>
        <div className="bg-muted p-4 rounded-2xl">
            <LatexMath block>{explanation.math}</LatexMath>
            {explanation.mathDescription && (
            <p className="text-sm text-fg-muted mt-2 italic">
                {explanation.mathDescription}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Use Cases */}
      <div>
        <h3 className="font-semibold mb-2">Best Use Cases</h3>
        <div className="flex flex-wrap gap-2">
          {explanation.useCases.map((useCase, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {useCase}
            </Badge>
          ))}
        </div>
      </div>

      {/* Pros and Cons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold mb-2 text-fg">Advantages</h4>
          <ul className="text-sm space-y-1">
            {explanation.pros.map((pro, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-xs mt-1 text-[var(--color-accent)]">✓</span>
                <span className="text-fg-muted">{pro}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2 text-fg">Limitations</h4>
          <ul className="text-sm space-y-1">
            {explanation.cons.map((con, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-xs mt-1 text-[var(--color-accent-2)]">✗</span>
                <span className="text-fg-muted">{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}