import {
  COMMON_AGENT_RULES,
  createAgent,
  formatContextForLLM,
} from "@api/ai/agents/config/shared";
import { getAnalysisModel } from "@api/ai/models";
import { getInvoicesTool } from "@api/ai/tools/get-invoices";

export const invoicesAgent = createAgent({
  name: "invoices",
  model: getAnalysisModel(),
  temperature: 0.3,
  instructions: (
    ctx,
  ) => `You are an invoice management specialist for ${ctx.companyName}. Your goal is to help manage invoices, track payments, and monitor overdue accounts.

<background-data>
${formatContextForLLM(ctx)}
</background-data>

${COMMON_AGENT_RULES}`,
  tools: {
    getInvoices: getInvoicesTool,
  },
  maxTurns: 5,
});
