import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Agent, type AgentConfig } from "@ai-sdk-tools/agents";
import { RedisProvider } from "@ai-sdk-tools/memory/redis";
import { openai } from "@ai-sdk/openai";
import type { ChatUserContext } from "@vendcfo/cache/chat-cache";
import { getSharedRedisClient } from "@vendcfo/cache/shared-redis";

// Lazy-load markdown files — these don't exist in the Vercel deployment
// bundle (the dashboard imports this module but runs in a different cwd).
// Reading at module evaluation time crashes the entire TRPC router.
let _memoryTemplate: string | null = null;
let _suggestionsInstructions: string | null = null;
let _titleInstructions: string | null = null;

function getMemoryTemplate(): string {
  if (_memoryTemplate === null) {
    try {
      _memoryTemplate = readFileSync(
        join(process.cwd(), "src/ai/agents/config/memory-template.md"),
        "utf-8",
      );
    } catch {
      _memoryTemplate =
        "You are a helpful financial assistant for vending machine operators.";
    }
  }
  return _memoryTemplate;
}

function getSuggestionsInstructions(): string {
  if (_suggestionsInstructions === null) {
    try {
      _suggestionsInstructions = readFileSync(
        join(process.cwd(), "src/ai/agents/config/suggestions-instructions.md"),
        "utf-8",
      );
    } catch {
      _suggestionsInstructions = "Generate helpful follow-up suggestions.";
    }
  }
  return _suggestionsInstructions;
}

function getTitleInstructions(): string {
  if (_titleInstructions === null) {
    try {
      _titleInstructions = readFileSync(
        join(process.cwd(), "src/ai/agents/config/title-instructions.md"),
        "utf-8",
      );
    } catch {
      _titleInstructions =
        "Generate a short, descriptive title for this conversation.";
    }
  }
  return _titleInstructions;
}

export function formatContextForLLM(context: AppContext): string {
  const businessCtx = (context as any).businessContext
    ? `\n\n${(context as any).businessContext}`
    : "";

  return `<company_info>
<current_date>${context.currentDateTime}</current_date>
<timezone>${context.timezone}</timezone>
<company_name>${context.companyName}</company_name>
<base_currency>${context.baseCurrency}</base_currency>
<locale>${context.locale}</locale>
</company_info>
${businessCtx}

Important: Use the current date/time above for time-sensitive operations. User-specific information is maintained in your working memory.`;
}

export const COMMON_AGENT_RULES = `<behavior_rules>
- Call tools immediately without explanatory text
- Use parallel tool calls when possible
- Provide specific numbers and actionable insights
- Explain your reasoning
- Lead with the most important information first
- When presenting repeated structured data (lists of items, multiple entries, time series), always use markdown tables
- Tables make data scannable and easier to compare - use them for any data with 2+ rows
</behavior_rules>

<pre-computed-data-rule>
Tool outputs now include pre-computed benchmark comparisons with a \`narrative\` field.
When presenting metrics:
1. Use the pre-computed \`narrative\` text directly — do NOT recalculate any numbers
2. Use the \`status\` field (below_range, at_target, above_range) to determine tone
3. Use the \`delta_from_target\` field for gap analysis — do NOT compute deltas yourself
4. If a \`warning\` field is present, surface it to the user
</pre-computed-data-rule>`;

/**
 * Dashboard metrics filter state - source of truth for AI tool defaults.
 * When present, tools use these values unless explicitly overridden.
 */
export interface MetricsFilter {
  period: string; // "1-year", "6-months", etc.
  from: string; // yyyy-MM-dd
  to: string; // yyyy-MM-dd
  currency?: string;
  revenueType: "gross" | "net";
}

/**
 * Forced tool call from widget click - bypasses AI parameter decisions.
 * When present for a matching tool, these params are used directly.
 */
export interface ForcedToolCall {
  toolName: string;
  toolParams: Record<string, unknown>;
}

export interface AppContext {
  userId: string;
  fullName: string;
  companyName: string;
  baseCurrency: string;
  locale: string;
  currentDateTime: string;
  country?: string;
  city?: string;
  region?: string;
  timezone: string;
  chatId: string;
  fiscalYearStartMonth?: number | null;
  hasBankAccounts?: boolean;
  hasTransactions?: boolean;

  /**
   * Dashboard metrics filter state (source of truth for defaults).
   * Tools use these values when no explicit params are provided.
   */
  metricsFilter?: MetricsFilter;

  /**
   * Forced tool params from widget click (bypasses AI decisions).
   * When a widget sends toolParams, they're stored here and used directly.
   */
  forcedToolCall?: ForcedToolCall;

  // Allow additional properties to satisfy Record<string, unknown> constraint
  [key: string]: unknown;
}

export function buildAppContext(
  context: ChatUserContext,
  chatId: string,
  options?: {
    metricsFilter?: MetricsFilter;
    forcedToolCall?: ForcedToolCall;
  },
): AppContext {
  // Combine userId and teamId to scope chats by both user and team
  const scopedUserId = `${context.userId}:${context.teamId}`;

  return {
    userId: scopedUserId,
    fullName: context.fullName ?? "",
    companyName: context.teamName ?? "",
    country: context.country ?? undefined,
    city: context.city ?? undefined,
    region: context.region ?? undefined,
    chatId,
    baseCurrency: context.baseCurrency ?? "USD",
    locale: context.locale ?? "en-US",
    currentDateTime: new Date().toISOString(),
    timezone:
      context.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    teamId: context.teamId,
    fiscalYearStartMonth: context.fiscalYearStartMonth ?? undefined,
    hasBankAccounts: context.hasBankAccounts ?? false,
    // Dashboard filter state and forced tool params
    metricsFilter: options?.metricsFilter,
    forcedToolCall: options?.forcedToolCall,
  };
}

export const memoryProvider = new RedisProvider(getSharedRedisClient());

export const createAgent = (config: AgentConfig<AppContext>) => {
  return new Agent({
    ...config,
    memory: {
      provider: memoryProvider,
      history: {
        enabled: true,
        limit: 10,
      },
      workingMemory: {
        enabled: true,
        template: getMemoryTemplate(),
        scope: "user",
      },
      chats: {
        enabled: true,
        generateTitle: {
          model: openai("gpt-4.1-nano"),
          instructions: getTitleInstructions(),
        },
        generateSuggestions: {
          enabled: true,
          model: openai("gpt-4.1-nano"),
          limit: 5,
          instructions: getSuggestionsInstructions(),
        },
      },
    },
  });
};
