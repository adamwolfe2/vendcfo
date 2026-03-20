import type { ConversationInsight } from "./extract-insights";

const topicMap: Record<string, string[]> = {
  getBurnRate: ["expenses", "costs", "burn", "spending"],
  getRevenueSummary: ["revenue", "sales", "income", "machines"],
  getProfitAnalysis: ["profit", "margin", "p&l"],
  getForecast: ["forecast", "projection", "future", "season"],
  getCashFlow: ["cash", "flow", "inflow", "outflow"],
  getExpenses: ["expense", "cost", "spend"],
  getGrowthRate: ["growth", "trend", "change"],
  getRunway: ["runway", "months", "survive"],
  getBalanceSheet: ["balance", "assets", "liabilities"],
  getBusinessHealthScore: ["health", "score", "overall"],
  getSpending: ["spending", "where", "money"],
  getTaxSummary: ["tax", "taxes"],
  getCashFlowStressTest: ["stress", "scenario", "what if"],
};

export function scoreInsightRelevance(
  insight: ConversationInsight,
  currentMessage: string,
  currentToolName?: string,
): number {
  let score = 0;
  const msgLower = currentMessage.toLowerCase();
  const contentLower = insight.content.toLowerCase();

  // Entity match
  if (insight.entity && msgLower.includes(insight.entity.toLowerCase())) {
    score += 0.5;
  }

  // Topic match via tool
  if (currentToolName) {
    const keywords = topicMap[currentToolName] || [];
    if (keywords.some((kw) => contentLower.includes(kw))) {
      score += 0.3;
    }
  }

  // Direct keyword overlap between message and insight
  const msgWords = msgLower.split(/\s+/).filter((w) => w.length > 3);
  const matchingWords = msgWords.filter((w) => contentLower.includes(w));
  score += Math.min(matchingWords.length * 0.1, 0.3);

  // Recency boost
  const daysSince =
    (Date.now() - new Date(insight.extracted_at).getTime()) /
    (1000 * 60 * 60 * 24);
  if (daysSince < 7) score += 0.2;
  else if (daysSince < 30) score += 0.1;

  // Type boosts
  if (insight.type === "correction") score += 0.3;
  if (insight.type === "goal") score += 0.1;

  return Math.min(score, 1.0);
}

export function getRelevantInsights(
  allInsights: ConversationInsight[],
  currentMessage: string,
  currentToolName?: string,
  maxInsights = 5,
): ConversationInsight[] {
  return allInsights
    .map((insight) => ({
      insight,
      relevance: scoreInsightRelevance(insight, currentMessage, currentToolName),
    }))
    .filter(({ relevance }) => relevance > 0.3)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, maxInsights)
    .map(({ insight }) => insight);
}

export function buildMemoryContext(
  relevantInsights: ConversationInsight[],
): string {
  if (relevantInsights.length === 0) return "";

  const sections: string[] = [];

  const corrections = relevantInsights.filter(
    (i) => i.type === "correction",
  );
  const goals = relevantInsights.filter((i) => i.type === "goal");
  const decisions = relevantInsights.filter((i) => i.type === "decision");
  const concerns = relevantInsights.filter((i) => i.type === "concern");

  if (corrections.length > 0) {
    sections.push(
      `IMPORTANT — user previously corrected:\n${corrections.map((c) => `- ${c.content}`).join("\n")}\nRespect these corrections.`,
    );
  }

  if (goals.length > 0) {
    sections.push(
      `User goals (reference if relevant):\n${goals.map((g) => `- ${g.content}`).join("\n")}`,
    );
  }

  if (decisions.length > 0) {
    sections.push(
      `Recent decisions:\n${decisions.map((d) => `- ${d.content}`).join("\n")}`,
    );
  }

  if (concerns.length > 0) {
    sections.push(
      `Recurring concerns:\n${concerns.map((c) => `- ${c.content}`).join("\n")}`,
    );
  }

  return `\n## Relevant Context from Past Conversations\n${sections.join("\n\n")}\nUse naturally when it connects to the current question. Do not force references.`;
}
