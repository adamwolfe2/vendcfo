import { handleToolError } from "./tool-helpers";

export function executeCalculation(input: {
  calculator: string;
  inputs: Record<string, number>;
}): string {
  try {
  const { calculator, inputs } = input;

  if (calculator === "margin") {
    const cost = inputs.unit_cost || 0;
    const price = inputs.retail_price || 0;
    const merchantFee = (inputs.merchant_fee_pct || 0) / 100;
    const revShare = (inputs.rev_share_pct || 0) / 100;
    const merchantAmt = price * merchantFee;
    const revShareAmt = price * revShare;
    const profit = price - cost - merchantAmt - revShareAmt;
    const margin = price > 0 ? (profit / price) * 100 : 0;
    const breakEven = cost / (1 - merchantFee - revShare);
    return JSON.stringify({
      calculator: "margin",
      net_profit: Number(profit.toFixed(2)),
      gross_margin_pct: Number(margin.toFixed(1)),
      break_even_price: Number(breakEven.toFixed(2)),
      merchant_fee_amount: Number(merchantAmt.toFixed(2)),
      rev_share_amount: Number(revShareAmt.toFixed(2)),
    });
  }

  if (calculator === "markup") {
    const cost = inputs.unit_cost || 0;
    const markupPct = inputs.markup_pct || 0;
    const price = cost * (1 + markupPct / 100);
    const profit = price - cost;
    const margin = price > 0 ? (profit / price) * 100 : 0;
    return JSON.stringify({
      calculator: "markup",
      selling_price: Number(price.toFixed(2)),
      gross_profit: Number(profit.toFixed(2)),
      effective_margin_pct: Number(margin.toFixed(1)),
      note: `${markupPct}% markup = ${margin.toFixed(1)}% margin (these are NOT the same number)`,
    });
  }

  if (calculator === "equipment_roi") {
    const machinePrice = inputs.machine_price || 0;
    const down = inputs.down_payment || 0;
    const apr = (inputs.apr || 8.5) / 100;
    const term = inputs.term_months || 36;
    const rev = inputs.target_revenue || 0;
    const cogs = inputs.est_cogs || 0;
    const loan = machinePrice - down;
    const monthlyRate = apr / 12;
    const payment =
      loan > 0
        ? (loan *
            (monthlyRate * Math.pow(1 + monthlyRate, term))) /
          (Math.pow(1 + monthlyRate, term) - 1)
        : 0;
    const grossProfit = rev - cogs;
    const netCashImpact = grossProfit - payment;
    const payback = grossProfit > 0 ? machinePrice / grossProfit : Infinity;
    return JSON.stringify({
      calculator: "equipment_roi",
      monthly_payment: Number(payment.toFixed(2)),
      net_cash_impact: Number(netCashImpact.toFixed(2)),
      payback_months: Number(payback.toFixed(1)),
      loan_amount: loan,
    });
  }

  if (calculator === "cash_flow") {
    const revenue = inputs.monthly_revenue || 0;
    const cogs = inputs.monthly_cogs || 0;
    const fixedCosts = inputs.monthly_fixed_costs || 0;
    const loanPayments = inputs.monthly_loan_payments || 0;
    const cashOnHand = inputs.cash_on_hand || 0;
    const netCashFlow = revenue - cogs - fixedCosts - loanPayments;
    const annualized = netCashFlow * 12;
    const runway =
      netCashFlow >= 0
        ? Infinity
        : cashOnHand / Math.abs(netCashFlow);
    return JSON.stringify({
      calculator: "cash_flow",
      net_cash_flow_monthly: Number(netCashFlow.toFixed(2)),
      annualized: Number(annualized.toFixed(2)),
      runway_months: runway === Infinity ? "infinite" : Number(runway.toFixed(1)),
    });
  }

  if (calculator === "route_profitability") {
    const stops = inputs.stops_per_route || 0;
    const avgRevPerStop = inputs.avg_revenue_per_stop || 0;
    const avgCogsPerStop = inputs.avg_cogs_per_stop || 0;
    const revSharePct = (inputs.rev_share_pct || 0) / 100;
    const driverCost = inputs.driver_cost || 0;
    const vehicleCost = inputs.vehicle_cost || 0;
    const grossRevenue = stops * avgRevPerStop;
    const totalCogs = stops * avgCogsPerStop;
    const revShareAmt = grossRevenue * revSharePct;
    const netProfit = grossRevenue - totalCogs - revShareAmt - driverCost - vehicleCost;
    const profitPerStop = stops > 0 ? netProfit / stops : 0;
    return JSON.stringify({
      calculator: "route_profitability",
      gross_revenue: Number(grossRevenue.toFixed(2)),
      net_profit: Number(netProfit.toFixed(2)),
      profit_per_stop: Number(profitPerStop.toFixed(2)),
      rev_share_amount: Number(revShareAmt.toFixed(2)),
    });
  }

  if (calculator === "labor_cost") {
    const hourlyWage = inputs.hourly_wage || 0;
    const hoursPerWeek = inputs.hours_per_week || 0;
    const overheadPct = (inputs.benefits_overhead_pct || 25) / 100;
    const routesServiced = inputs.routes_serviced || 1;
    const stopsPerRoute = inputs.stops_per_route || 1;
    const weeklyCost = hourlyWage * hoursPerWeek * (1 + overheadPct);
    const monthlyCost = weeklyCost * 4.33;
    const costPerRoute = monthlyCost / routesServiced;
    const costPerStop = costPerRoute / stopsPerRoute;
    return JSON.stringify({
      calculator: "labor_cost",
      weekly_cost: Number(weeklyCost.toFixed(2)),
      monthly_cost: Number(monthlyCost.toFixed(2)),
      cost_per_route: Number(costPerRoute.toFixed(2)),
      cost_per_stop: Number(costPerStop.toFixed(2)),
    });
  }

  if (calculator === "break_even") {
    const fixedCosts = inputs.global_fixed_costs || 0;
    const marginPct = (inputs.avg_margin_pct || 0) / 100;
    const fixedPerLocation = inputs.fixed_cost_per_location || 0;
    const monthlyDebt = inputs.monthly_debt || 0;
    const totalFixed = fixedCosts + monthlyDebt;
    const revenueRequired = marginPct > 0 ? totalFixed / marginPct : Infinity;
    const locationsRequired =
      fixedPerLocation > 0 && marginPct > 0
        ? Math.ceil(totalFixed / (fixedPerLocation * marginPct))
        : 0;
    return JSON.stringify({
      calculator: "break_even",
      revenue_required_monthly: revenueRequired === Infinity ? "infinite" : Number(revenueRequired.toFixed(2)),
      locations_required: locationsRequired,
    });
  }

  if (calculator === "revenue_share") {
    const monthlySales = inputs.monthly_sales || 0;
    const commissionPct = (inputs.commission_pct || 0) / 100;
    const payout = monthlySales * commissionPct;
    const netRetained = monthlySales - payout;
    const grossProfit = monthlySales * 0.52; // assume 52% gross margin
    const marginRisk = grossProfit > 0 ? (payout / grossProfit) * 100 : 0;
    return JSON.stringify({
      calculator: "revenue_share",
      total_payout: Number(payout.toFixed(2)),
      net_retained: Number(netRetained.toFixed(2)),
      margin_risk_pct: Number(marginRisk.toFixed(1)),
      note:
        marginRisk > 40
          ? "WARNING: Location is consuming over 40% of gross profit"
          : marginRisk > 25
            ? "Moderate: Location takes a significant share of gross profit"
            : "Healthy: Revenue share is manageable",
    });
  }

  return JSON.stringify({
    error: "Calculator not implemented yet",
    available: [
      "margin",
      "markup",
      "equipment_roi",
      "cash_flow",
      "route_profitability",
      "labor_cost",
      "break_even",
      "revenue_share",
    ],
  });
  } catch (error) {
    return handleToolError(error);
  }
}
