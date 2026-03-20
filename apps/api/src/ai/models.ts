import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";

// Model strategy optimized for SPEED and ACCURACY:
// - GPT-4o-mini: triage routing (fastest, cheapest, 200ms)
// - Claude Sonnet 4.6: financial analysis + reports (fast + accurate)
// - Claude Sonnet 4.6: calculator math (needs precision)
// - GPT-4o: fallback if no Anthropic key

export const models = {
  // Fast routing and classification (~200ms)
  fast: openai("gpt-4o-mini"),
  // Financial analysis — Sonnet 4.6 for speed + accuracy
  analysis: anthropic("claude-sonnet-4-20250514"),
  // Report generation — same model, consistent output
  reports: anthropic("claude-sonnet-4-20250514"),
  // Calculator specialist — needs mathematical precision
  calculator: anthropic("claude-sonnet-4-20250514"),
  // Fallback if Anthropic key not set
  fallback: openai("gpt-4o"),
};

export function getAnalysisModel() {
  if (process.env.ANTHROPIC_API_KEY) {
    return models.analysis;
  }
  return models.fallback;
}

export function getReportsModel() {
  if (process.env.ANTHROPIC_API_KEY) {
    return models.reports;
  }
  return models.fallback;
}

export function getCalculatorModel() {
  if (process.env.ANTHROPIC_API_KEY) {
    return models.calculator;
  }
  return models.fallback;
}
