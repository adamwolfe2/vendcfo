import { VendingDbState } from './mock-db/db';

export function calculateDashboardMetrics(db: VendingDbState) {
  let totalRevenue = 0;
  let totalExpense = 0;
  let totalMargin = 0;

  db.transactions.forEach((tx) => {
    const amount = parseFloat(tx.Amount.replace(/[^0-9.-]+/g, ""));
    if (amount > 0) {
      totalRevenue += amount;
    } else {
      totalExpense += Math.abs(amount);
    }
  });

  const netProfit = totalRevenue - totalExpense;
  const grossMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Derive cash on hand assuming $20,000 baseline + profit
  const cashOnHand = 20000 + netProfit;

  return {
    revenue: totalRevenue,
    profit: netProfit,
    margin: grossMargin,
    cash: cashOnHand
  };
}
