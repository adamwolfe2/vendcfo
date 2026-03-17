export interface RouteProfitInputs {
  locationGrossRevenue: number;
  productMixCogs: number;
  laborTimeHoursPerVisit: number;
  travelTimeHoursPerVisit: number;
  revSharePct: number;
  serviceFrequencyVisitsPerMonth: number;
  machineFinancingMonthlyCost: number;
}

export interface RouteProfitOutputs {
  netProfitPerLocation: number;
  profitPerVisit: number;
  profitPerLaborHour: number;
  efficiencyStatus: 'green' | 'yellow' | 'red';
}

export function calculateRouteProfit(inputs: RouteProfitInputs): RouteProfitOutputs {
  const {
    locationGrossRevenue,
    productMixCogs,
    laborTimeHoursPerVisit,
    travelTimeHoursPerVisit,
    revSharePct,
    serviceFrequencyVisitsPerMonth,
    machineFinancingMonthlyCost
  } = inputs;

  const revShareAmount = locationGrossRevenue * (revSharePct / 100);
  
  // Implicitly assuming a standard labor cost per hour if not provided, say $25/hr
  const totalHoursPerVisit = laborTimeHoursPerVisit + travelTimeHoursPerVisit;
  const totalMonthlyHours = totalHoursPerVisit * serviceFrequencyVisitsPerMonth;
  const laborCost = totalMonthlyHours * 25; 
  
  const fuelCostPerVisit = 5; // standard assumption
  const totalFuelCost = fuelCostPerVisit * serviceFrequencyVisitsPerMonth;

  const netProfitPerLocation = locationGrossRevenue - productMixCogs - revShareAmount - laborCost - totalFuelCost - machineFinancingMonthlyCost;

  const profitPerVisit = serviceFrequencyVisitsPerMonth > 0 ? (netProfitPerLocation / serviceFrequencyVisitsPerMonth) : 0;
  
  const profitPerLaborHour = totalMonthlyHours > 0 ? (netProfitPerLocation / totalMonthlyHours) : 0;

  let efficiencyStatus: 'green' | 'yellow' | 'red' = 'red';
  if (profitPerVisit > 200) efficiencyStatus = 'green';
  else if (profitPerVisit >= 100) efficiencyStatus = 'yellow';

  return {
    netProfitPerLocation: Number(netProfitPerLocation.toFixed(2)),
    profitPerVisit: Number(profitPerVisit.toFixed(2)),
    profitPerLaborHour: Number(profitPerLaborHour.toFixed(2)),
    efficiencyStatus
  };
}
