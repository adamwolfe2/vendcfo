export const CALCULATOR_KNOWLEDGE = `
<calculator-intelligence>
You have deep knowledge of 9 financial calculators on the Calculators page. When users ask about pricing, margins, hiring, expansion, or any financial decision, guide them to the right calculator and interpret results.

CALCULATOR 1: MARGIN CALCULATOR
- Inputs: Unit Cost, Retail Price, Merchant Fee %, Rev Share %
- Outputs: Net Profit, Gross Margin %, Break Even Price
- Math: Net Profit = Price - Cost - (Price × MerchantFee%) - (Price × RevShare%)
- Key insight: A "small" 10% rev share = 20% of gross profit at typical margins
- Benchmarks: Snacks 45-60% margin, Beverages 50-65%, Mixed 50-55%
- If margin < 30%, product may not be worth stocking
- Break Even = Cost / (1 - MerchantFee% - RevShare%)

CALCULATOR 2: MARKUP CALCULATOR
- Inputs: Unit Cost, Desired Markup %
- Outputs: Selling Price, Gross Profit, Effective Margin %
- Key insight: Markup ≠ Margin. 100% markup = 50% margin. 50% markup = 33% margin.
- Does NOT include merchant fees or rev share — direct to Margin Calculator for full picture
- Target: 100-150% markup on snacks, 150-200% on beverages

CALCULATOR 3: CASH FLOW FORECAST
- Inputs: Revenue/Mo, COGS/Mo, Fixed Costs/Mo, Loan Payments/Mo, Cash on Hand
- Outputs: Net Cash Flow/Mo, Annualized, Cash Runway (months or infinite)
- COGS should be 40-55% of revenue
- Fixed costs target: under 20% of revenue
- Net margin target: 15-25%
- Runway ∞ means self-sustaining, but thin positive ($200/mo) = zero buffer

CALCULATOR 4: ROUTE PROFITABILITY
- Inputs: Stops/Route, Avg Rev/Stop, Avg COGS/Stop, Rev Share %, Driver Cost, Vehicle Cost
- Outputs: Gross Revenue, Net Profit, Profit/Stop
- Healthy profit/stop: $50-100. Below $30 = consider dropping the stop.
- Driver + vehicle are FIXED per route — more stops = lower cost per stop
- Fastest improvement: drop lowest-revenue stops, add higher-revenue ones nearby

CALCULATOR 5: LABOR / HIRING
- Inputs: Employee name, Hourly Wage, Hours/Week, Benefits Overhead %, Routes Serviced, Stops/Route
- Outputs per employee: Weekly/Monthly cost. Total: Cost/Route, Cost/Stop
- 25% overhead is minimum (FICA 7.65%, workers comp 3-5%, etc.)
- Labor target: 12-18% of revenue. Above 22% = high.
- Before hiring: can routes be combined? Can frequency be reduced? Part-time first?

CALCULATOR 6: PRODUCT MIX ANALYZER
- Inputs per product: Name, Units sold, Margin %
- Outputs: Total Units, Weighted Average Margin %
- Volume matters more than per-unit margin
- Target blended margin: 50-55%
- Run per LOCATION, not just overall — different locations need different mixes

CALCULATOR 7: EQUIPMENT ROI & FINANCING
- Inputs: Machine Price, Down Payment, APR, Term, Target Rev/Mo, Est COGS/Mo
- Outputs: Monthly Payment, Net Cash Impact/Mo, ROI Payback (months)
- Target payback: 12-18 months. Above 24 = risky.
- Positive Net Cash Impact = machine pays for itself from day one
- New machine: $3-7k. Refurbished: $1.5-3.5k (dramatically better ROI)
- Only buy with a CONFIRMED location

CALCULATOR 8: BREAK-EVEN ANALYSIS
- Inputs: Global Fixed Costs, Avg Margin %, Fixed Cost/Location, Monthly Debt
- Outputs: Revenue Required/Mo, Locations Required
- Revenue Required = Total Fixed Costs / Margin%
- Each new location adds fixed cost — location must generate enough margin to cover its own cost
- Minimum viable revenue per location = Fixed Cost/Location / Margin%

CALCULATOR 9: REVENUE SHARE CALCULATOR
- Inputs: Monthly Sales, Commission Type (Flat/Tiered/Fixed), Commission %
- Outputs: Total Payout, Net Retained, Margin Risk %
- 10% of revenue = ~20% of gross profit (the location takes more than operators realize)
- Margin Risk = Payout / Gross Profit — above 35-40% = working mostly for the host
- Negotiate: fixed fee > percentage, tiered > flat, product allowance > cash

CROSS-CALCULATOR CONNECTIONS:
- Margin Calculator → feeds into Product Mix Analyzer (margin per SKU)
- Product Mix → feeds into Break-Even (blended margin)
- Equipment ROI → feeds into Cash Flow Forecast (loan payments)
- Route Profitability → informs Labor/Hiring decisions
- Revenue Share → feeds into Margin Calculator (commission impact)

WHEN HELPING WITH CALCULATORS:
1. Identify which calculator fits their question
2. Offer to pre-fill with their real VendCFO data
3. Interpret results against industry benchmarks
4. Give 1-2 specific actions
5. Suggest the next calculator to run
</calculator-intelligence>
`;
