"use client";

import { PAY_MODEL_LABELS } from "./constants";
import { fmtCurrency, toNum } from "./helpers";
import type { CompensationPlanRow, EmployeeRow } from "./types";

// ---------------------------------------------------------------------------
// Compensation Summary Card
// ---------------------------------------------------------------------------

export function CompensationSummary({
  employees,
  plans,
}: {
  employees: EmployeeRow[];
  plans: CompensationPlanRow[];
}) {
  const activeEmployees = employees.filter((e) => e.is_active);
  const activePlans = plans.filter((p) => p.is_active);

  // Build lookup: employeeId -> active plan
  const planByEmployee: Record<string, CompensationPlanRow> = {};
  for (const plan of activePlans) {
    planByEmployee[plan.employee_id] = plan;
  }

  // Pay model distribution
  const modelCounts: Record<string, number> = {
    hourly: 0,
    per_task: 0,
    hybrid: 0,
  };
  for (const plan of activePlans) {
    const key = plan.pay_model;
    modelCounts[key] = (modelCounts[key] ?? 0) + 1;
  }

  // Estimate weekly cost (40hrs for hourly/hybrid, rough estimate for per_task)
  const HOURS_PER_WEEK = 40;
  let totalWeeklyCost = 0;
  const breakdown: { name: string; weeklyCost: number; model: string }[] = [];

  for (const emp of activeEmployees) {
    const plan = planByEmployee[emp.id];
    if (!plan) {
      breakdown.push({ name: emp.name, weeklyCost: 0, model: "none" });
      continue;
    }

    let cost = 0;
    if (plan.pay_model === "hourly") {
      cost = toNum(plan.hourly_rate) * HOURS_PER_WEEK;
    } else if (plan.pay_model === "hybrid") {
      cost = toNum(plan.hourly_rate) * HOURS_PER_WEEK;
    } else if (plan.pay_model === "per_task") {
      // Rough estimate: 20 stops/week, 3 machines/stop avg
      cost =
        toNum(plan.per_stop_rate) * 20 + toNum(plan.per_machine_rate) * 60;
    }

    totalWeeklyCost += cost;
    breakdown.push({
      name: emp.name,
      weeklyCost: cost,
      model: plan.pay_model,
    });
  }

  if (activeEmployees.length === 0) return null;

  return (
    <div className="rounded-lg border border-[#e0e0e0] bg-white p-5 mb-6">
      <h3 className="text-sm font-semibold text-[#111] mb-4">
        Compensation Summary
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {/* Total weekly estimate */}
        <div className="rounded-lg bg-[#fafafa] border border-[#e6e6e6] p-3">
          <p className="text-xs text-[#999] mb-1">Est. Weekly Labor Cost</p>
          <p className="text-lg font-bold text-[#111]">
            {fmtCurrency(totalWeeklyCost)}
          </p>
        </div>

        {/* Active employees */}
        <div className="rounded-lg bg-[#fafafa] border border-[#e6e6e6] p-3">
          <p className="text-xs text-[#999] mb-1">Active Employees</p>
          <p className="text-lg font-bold text-[#111]">
            {activeEmployees.length}
          </p>
        </div>

        {/* Model distribution */}
        <div className="rounded-lg bg-[#fafafa] border border-[#e6e6e6] p-3">
          <p className="text-xs text-[#999] mb-1">Pay Models</p>
          <div className="flex items-center gap-2 mt-1">
            {Object.entries(modelCounts)
              .filter(([, count]) => count > 0)
              .map(([model, count]) => (
                <span
                  key={model}
                  className="inline-flex items-center rounded-full border border-[#ddd] bg-white px-2 py-0.5 text-xs font-medium text-[#555]"
                >
                  {PAY_MODEL_LABELS[model] ?? model}: {count}
                </span>
              ))}
            {Object.values(modelCounts).every((c) => c === 0) && (
              <span className="text-sm text-[#999]">--</span>
            )}
          </div>
        </div>
      </div>

      {/* Per-employee breakdown */}
      {breakdown.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e0e0e0]">
                <th className="pb-2 text-left font-medium text-[#555]">
                  Employee
                </th>
                <th className="pb-2 text-left font-medium text-[#555]">
                  Model
                </th>
                <th className="pb-2 text-right font-medium text-[#555]">
                  Est. Weekly
                </th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((row) => (
                <tr
                  key={row.name}
                  className="border-b border-[#f0f0f0] last:border-0"
                >
                  <td className="py-2 text-[#111]">{row.name}</td>
                  <td className="py-2">
                    <span className="inline-flex items-center rounded-full border border-[#ddd] bg-[#f0f0f0] px-2 py-0.5 text-xs font-medium text-[#555]">
                      {row.model === "none"
                        ? "No plan"
                        : (PAY_MODEL_LABELS[row.model] ?? row.model)}
                    </span>
                  </td>
                  <td className="py-2 text-right font-mono text-[#555]">
                    {row.weeklyCost > 0 ? fmtCurrency(row.weeklyCost) : "--"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
