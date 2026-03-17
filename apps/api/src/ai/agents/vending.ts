import { openai } from "@ai-sdk/openai";
import { createAgent, formatContextForLLM } from "./config/shared";
import { 
  marginCalculatorTool, 
  equipmentFinancingTool, 
  routeProfitabilityTool 
} from "@vendcfo/vending-kb";
import { VENDING_INDUSTRY_RULES } from "@vendcfo/vending-kb";

export const vendingAgent = createAgent({
  name: "vending",
  model: openai("gpt-4o-mini"),
  temperature: 0.1,
  instructions: (ctx) => `You are the VendCFO AI, a specialized assistant for vending machine operators.

Use the following context to understand the user's business:
<background-data>
${formatContextForLLM(ctx)}
</background-data>

<vending-rules>
${VENDING_INDUSTRY_RULES}
</vending-rules>

When asked about product pricing or margins, ALWAYS use the calculateMargin tool.
When asked about buying a machine, ALWAYS use the equipmentFinancing tool.
When asked about route efficiency, ALWAYS use the routeProfitability tool.
`,
  tools: {
    calculateMargin: marginCalculatorTool,
    equipmentFinancing: equipmentFinancingTool,
    routeProfitability: routeProfitabilityTool
  },
});
