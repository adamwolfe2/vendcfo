import {
  marginSchema,
  equipmentFinancingSchema,
  routeProfitabilitySchema,
  calculateLaborSchema,
  cashFlowSchema,
  runScenarioSchema,
  getAlertsSchema
} from './schemas';

import {
  calculateMargin,
  calculateEquipmentROI,
  calculateRouteProfitability,
  calculateLaborBreakeven,
  calculateCashFlow
} from '@vendcfo/calculators';

// Exported tools matching the Vercel AI SDK "tool" pattern
export const marginCalculatorTool = {
  description: 'Calculates the true gross margin, markup, net profit per unit, and break-even price for a product SKU.',
  parameters: marginSchema,
  execute: async (args: any) => { return calculateMargin(args); }
};

export const equipmentFinancingTool = {
  description: 'Determines monthly payments, payback period, and cash-on-cash impact of financing a vending machine.',
  parameters: equipmentFinancingSchema,
  execute: async (args: any) => { return calculateEquipmentROI(args); }
};

export const routeProfitabilityTool = {
  description: 'Retrieves ranked route profitability metrics. Call this when asked "which locations are my least profitable?".',
  parameters: routeProfitabilitySchema,
  execute: async (args: any) => { return calculateRouteProfitability({ ...args, mockData: true }); }
};

export const laborBreakevenTool = {
  description: 'Calculates the fully loaded cost of labor and the required revenue to break even. Call when asked "Should I add another picker?".',
  parameters: calculateLaborSchema,
  execute: async (args: any) => { return calculateLaborBreakeven(args); }
};

export const cashFlowTool = {
  description: 'Returns a 30, 60, or 90 day cash flow projection. Call when asked "Can I afford a new machine this month?".',
  parameters: cashFlowSchema,
  execute: async (args: any) => { return calculateCashFlow(args); }
};

