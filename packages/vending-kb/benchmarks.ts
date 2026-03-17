export const VENDING_BENCHMARKS = {
  margins: {
    beverages: { min: 35, max: 45 },
    snacks: { min: 30, max: 40 },
    freshFood: { min: 20, max: 30 },
  },
  cogsPctOfRevenue: { min: 45, max: 55 },
  targetLaborCostPct: {
    ownerOperated: 25, // <25%
    staffedRoute: 35, // <35%
  },
  revShareNorms: {
    standard: { min: 10, max: 20 },
    premium: { max: 30 },
  },
  targetProfitPerMachineMonthly: { min: 150, max: 400 },
  avgServicingCostPerVisit: { min: 15, max: 40 },
  machinePaybackWindowMonths: {
    good: 18, // <18
    risky: 24, // >24
  },
  cashReserveRecommendationMonths: { min: 2, max: 3 },
  breakEvenMachineRevenue: { min: 500, max: 800 },
};
