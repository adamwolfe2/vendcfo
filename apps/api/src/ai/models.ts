import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";

// Dual-model strategy:
// - GPT-4o-mini for fast routing and simple tasks
// - Claude Sonnet for deep financial analysis and report generation
export const models = {
  // Fast routing and classification
  fast: openai("gpt-4o-mini"),
  // Deep financial analysis, reports, insights
  analysis: anthropic("claude-sonnet-4-20250514"),
  // Report narrative generation
  reports: anthropic("claude-sonnet-4-20250514"),
  // Fallback if Anthropic key not set
  fallback: openai("gpt-4o"),
};

// Use analysis model if ANTHROPIC_API_KEY is set, otherwise fallback to OpenAI
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
