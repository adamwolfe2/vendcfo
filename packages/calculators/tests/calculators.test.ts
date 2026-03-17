import { describe, test, expect } from 'bun:test';
import { calculateMargin, MarginInputs } from '../margin';
import { calculateEquipmentFinancing, EquipmentFinancingInputs } from '../financing';
import { calculateLabor } from '../labor';

describe('Margin Calculator', () => {
  test('calculates standard margin correctly', () => {
    const inputs: MarginInputs = {
      unitCost: 1.00,
      retailPrice: 2.50,
      taxRatePct: 0,
      spoilagePct: 0,
      merchantFeePct: 2.75,
      revSharePct: 15
    };
    
    const results = calculateMargin(inputs);
    
    // total fees = 17.75% of 2.50 = 0.44375
    // net profit = 2.50 - 1.00 - 0.44375 = 1.05625
    expect(results.netProfitPerUnit).toBeCloseTo(1.06, 2);
    
    // margin = net profit / retail price = 1.05625 / 2.50 = 42.25%
    expect(results.grossMarginPct).toBeCloseTo(42.25, 2);
  });
});

describe('Financing Calculator', () => {
  test('calculates monthly amortization correctly', () => {
    const inputs: EquipmentFinancingInputs = {
      equipmentPrice: 5000,
      downPayment: 1000,
      apr: 6.0,
      termMonths: 36,
      expectedMonthlyGrossRevenue: 800,
      expectedMonthlyCogs: 400,
      expectedRevSharePct: 10,
      expectedMonthlyServicingCost: 50
    };

    const results = calculateEquipmentFinancing(inputs);
    // Principal = 4000
    // APR = 6% -> 0.005 per month
    // Payment = 4000 * 0.005 * (1.005^36) / (1.005^36 - 1) = 121.68
    expect(results.monthlyPayment).toBeCloseTo(121.69, 1);
    expect(results.amortizationSchedule.length).toBe(36);
    expect(results.monthsToPayback).toBeGreaterThan(0);
  });
});

describe('Labor Calculator', () => {
  test('calculates fully loaded labor breakeven', () => {
    const results = calculateLabor({
      hourlyWage: 20,
      hoursPerWeek: 15,
      payrollBurdenPct: 15,
      expectedRouteRevenueIncrease: 3000,
      serviceTimeSavedHours: 15,
      numberOfStopsToAdd: 5
    });

    // 20 * 1.15 = 23
    // 23 * 15 = 345 / week
    // 345 * 4.33 = 1493.85 / month
    expect(results.fullyLoadedMonthlyCost).toBeCloseTo(1493.85, 1);
    expect(results.costPerAdditionalStop).toBe(345 / 5);
  });
});
