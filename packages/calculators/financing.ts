export interface EquipmentFinancingInputs {
  equipmentPrice: number;
  downPayment: number;
  apr: number; // Annual Percentage Rate (e.g. 5.5)
  termMonths: number;
  expectedMonthlyGrossRevenue: number;
  expectedMonthlyCogs: number;
  expectedRevSharePct?: number; // Optional
  expectedMonthlyServicingCost: number;
}

export interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}

export interface EquipmentFinancingOutputs {
  monthlyPayment: number;
  totalInterestPaid: number;
  cashOnCashMonthlyImpact: number; // Net profit after payment
  monthsToPayback: number;
  breakEvenMonthlySalesRequired: number;
  amortizationSchedule: AmortizationRow[];
}

export function calculateEquipmentFinancing(inputs: EquipmentFinancingInputs): EquipmentFinancingOutputs {
  const {
    equipmentPrice,
    downPayment,
    apr,
    termMonths,
    expectedMonthlyGrossRevenue,
    expectedMonthlyCogs,
    expectedRevSharePct = 0,
    expectedMonthlyServicingCost,
  } = inputs;

  const principal = equipmentPrice - downPayment;
  const monthlyRate = (apr / 100) / 12;

  // Monthly payment formula = P * r * (1+r)^n / ((1+r)^n - 1)
  const monthlyPayment = principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths) / 
                         (Math.pow(1 + monthlyRate, termMonths) - 1);

  let currentBalance = principal;
  let totalInterest = 0;
  const schedule: AmortizationRow[] = [];

  for (let month = 1; month <= termMonths; month++) {
    const interestPayment = currentBalance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    currentBalance -= principalPayment;
    totalInterest += interestPayment;

    schedule.push({
      month,
      payment: Number(monthlyPayment.toFixed(2)),
      principal: Number(principalPayment.toFixed(2)),
      interest: Number(interestPayment.toFixed(2)),
      remainingBalance: Number(Math.max(0, currentBalance).toFixed(2))
    });
  }

  // Monthly net before payment
  const revShareCost = expectedMonthlyGrossRevenue * (expectedRevSharePct / 100);
  const monthlyNetOperatingIncome = expectedMonthlyGrossRevenue - expectedMonthlyCogs - revShareCost - expectedMonthlyServicingCost;
  
  const cashOnCashMonthlyImpact = monthlyNetOperatingIncome - monthlyPayment;

  // Payback period
  // Total cash layout = downPayment + sum of net negative months (simplified, we usually mean months to recoup the downpayment + equipment cost)
  // Monthly free cash flow = net income - payment
  const monthsToPayback = monthlyNetOperatingIncome > 0 ? (equipmentPrice / monthlyNetOperatingIncome) : Infinity;

  // Break-even monthly sales = COGS + Servicing + RevShare + Payment
  // revenue - (revenue * Cogs% + revShare) - fixed = 0
  // Cogs% approx = expectedMonthlyCogs / expectedMonthlyGrossRevenue
  const cogsPct = expectedMonthlyGrossRevenue > 0 ? (expectedMonthlyCogs / expectedMonthlyGrossRevenue) : 0.5;
  const variableCostPct = cogsPct + (expectedRevSharePct / 100);
  const fixedCosts = expectedMonthlyServicingCost + monthlyPayment;

  const breakEvenMonthlySalesRequired = (1 - variableCostPct) > 0 ? (fixedCosts / (1 - variableCostPct)) : Infinity;

  return {
    monthlyPayment: Number(monthlyPayment.toFixed(2)),
    totalInterestPaid: Number(totalInterest.toFixed(2)),
    cashOnCashMonthlyImpact: Number(cashOnCashMonthlyImpact.toFixed(2)),
    monthsToPayback: Number(monthsToPayback.toFixed(1)),
    breakEvenMonthlySalesRequired: Number(breakEvenMonthlySalesRequired.toFixed(2)),
    amortizationSchedule: schedule
  };
}
