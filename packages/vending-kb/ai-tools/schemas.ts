import { z } from 'zod';
// Assuming tools are exported and registered via VendHub's AI package structure
// We provide zod schemas corresponding to the new mathematical tools

export const marginSchema = z.object({
  unitCost: z.number().describe('The cost to purchase a single unit from the supplier'),
  retailPrice: z.number().describe('The price the item will be sold for in the machine'),
  taxRatePct: z.number().optional().describe('Applicable sales tax percentage'),
  spoilagePct: z.number().optional().describe('Expected waste/spoilage percentage'),
  merchantFeePct: z.number().optional().default(2.75).describe('Credit card processing fee percentage'),
  revSharePct: z.number().optional().describe('Percentage of revenue shared with the location'),
});

export const equipmentFinancingSchema = z.object({
  equipmentPrice: z.number().describe('Total price of the vending machine'),
  downPayment: z.number().describe('Upfront cash paid'),
  apr: z.number().describe('Annual Percentage Rate for the loan (e.g. 5.5)'),
  termMonths: z.number().describe('Length of the loan in months (e.g. 36)'),
  expectedMonthlyGrossRevenue: z.number().describe('Expected monthly gross sales from this machine'),
  expectedMonthlyCogs: z.number().describe('Expected monthly Cost of Goods Sold for this machine'),
  expectedRevSharePct: z.number().optional().describe('Revenue share percentage paid to location'),
  expectedMonthlyServicingCost: z.number().describe('Expected monthly fixed cost to service this machine (labor + fuel)'),
});

export const routeProfitabilitySchema = z.object({
  routeId: z.string().optional().describe('Specific Route ID if analyzing a known route'),
  period: z.string().optional().describe('Time period string, e.g. "last_month" or "Q1"'),
});

export const calculateLaborSchema = z.object({
  hourlyWage: z.number().describe('Hourly rate to pay the new route operator/picker'),
  hoursPerWeek: z.number().describe('Expected hours to work per week'),
  payrollBurdenPct: z.number().optional().default(15).describe('Additional cost percent for taxes/insurance'),
  expectedRouteRevenueIncrease: z.number().describe('How much more monthly revenue will this hire generate?'),
  serviceTimeSavedHours: z.number().describe('Hours saved per week by the business owner/manager'),
  numberOfStopsToAdd: z.number().describe('Number of new locations this hire will service'),
});

export const cashFlowSchema = z.object({
  days: z.enum(['30', '60', '90']).describe('Forecast duration in days'),
});

export const runScenarioSchema = z.object({
  scenarioType: z.enum(['hire', 'equipment', 'location', 'pricing', 'rev_share', 'dense_route']),
  params: z.record(z.any()).describe('Parameters specific to the scenario type')
});

export const getAlertsSchema = z.object({
  severity: z.enum(['warning', 'critical', 'opportunity', 'all']).optional(),
});
