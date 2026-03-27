import { db } from "@vendcfo/db/client";
import {
  employees,
  compensationPlans,
  operatorWeeklyPlan,
  operatorRates,
  capacityAlerts,
} from "@vendcfo/db/schema/vending";
import { eq, and, gte, lte, sql, count, desc } from "drizzle-orm";
import { getDateRange, handleToolError } from "./tool-helpers";

export async function queryWorkforceData(
  input: {
    query_type: string;
    employeeId?: string;
    period?: string;
  },
  teamId: string,
): Promise<string> {
  try {
    if (input.query_type === "employees") {
      const results = await db
        .select({
          id: employees.id,
          name: employees.name,
          email: employees.email,
          phone: employees.phone,
          role: employees.role,
          employmentType: employees.employment_type,
          maxWeeklyHours: employees.max_weekly_hours,
          hourlyRate: employees.hourly_rate,
          hireDate: employees.hire_date,
          isActive: employees.is_active,
        })
        .from(employees)
        .where(eq(employees.business_id, teamId))
        .limit(50);

      return JSON.stringify({
        type: "employees",
        count: results.length,
        employees: results,
      });
    }

    if (input.query_type === "compensation_plans") {
      const conditions: ReturnType<typeof eq>[] = [
        eq(compensationPlans.business_id, teamId),
      ];
      if (input.employeeId) {
        conditions.push(eq(compensationPlans.employee_id, input.employeeId));
      }

      const results = await db
        .select({
          id: compensationPlans.id,
          employeeId: compensationPlans.employee_id,
          employeeName: employees.name,
          planName: compensationPlans.name,
          payModel: compensationPlans.pay_model,
          hourlyRate: compensationPlans.hourly_rate,
          perMachineRate: compensationPlans.per_machine_rate,
          perStopRate: compensationPlans.per_stop_rate,
          revenueSharePct: compensationPlans.revenue_share_pct,
          effectiveFrom: compensationPlans.effective_from,
          effectiveTo: compensationPlans.effective_to,
          isActive: compensationPlans.is_active,
        })
        .from(compensationPlans)
        .innerJoin(employees, eq(compensationPlans.employee_id, employees.id))
        .where(and(...conditions))
        .limit(50);

      return JSON.stringify({
        type: "compensation_plans",
        count: results.length,
        plans: results,
      });
    }

    if (input.query_type === "labor_costs") {
      const { from, to } = getDateRange(input.period);

      const results = await db
        .select({
          operatorId: operatorWeeklyPlan.operator_id,
          weekStart: operatorWeeklyPlan.week_start,
          dayOfWeek: operatorWeeklyPlan.day_of_week,
          plannedStops: operatorWeeklyPlan.planned_stops,
          plannedDrivingHrs: operatorWeeklyPlan.planned_driving_hrs,
          plannedWarehouseHrs: operatorWeeklyPlan.planned_warehouse_hrs,
          plannedStockHrs: operatorWeeklyPlan.planned_stock_hrs,
          plannedPickHrs: operatorWeeklyPlan.planned_pick_hrs,
          plannedLoadVanHrs: operatorWeeklyPlan.planned_load_van_hrs,
          actualStops: operatorWeeklyPlan.actual_stops,
          actualDrivingHrs: operatorWeeklyPlan.actual_driving_hrs,
          actualWarehouseHrs: operatorWeeklyPlan.actual_warehouse_hrs,
          actualStockHrs: operatorWeeklyPlan.actual_stock_hrs,
          actualPickHrs: operatorWeeklyPlan.actual_pick_hrs,
          actualLoadVanHrs: operatorWeeklyPlan.actual_load_van_hrs,
        })
        .from(operatorWeeklyPlan)
        .where(
          and(
            eq(operatorWeeklyPlan.business_id, teamId),
            gte(operatorWeeklyPlan.week_start, from),
            lte(operatorWeeklyPlan.week_start, to),
          ),
        )
        .orderBy(desc(operatorWeeklyPlan.week_start))
        .limit(100);

      // Compute total planned & actual hours
      let totalPlannedHrs = 0;
      let totalActualHrs = 0;
      let totalPlannedStops = 0;
      let totalActualStops = 0;

      for (const r of results) {
        totalPlannedHrs +=
          Number(r.plannedDrivingHrs || 0) +
          Number(r.plannedWarehouseHrs || 0) +
          Number(r.plannedStockHrs || 0) +
          Number(r.plannedPickHrs || 0) +
          Number(r.plannedLoadVanHrs || 0);
        totalActualHrs +=
          Number(r.actualDrivingHrs || 0) +
          Number(r.actualWarehouseHrs || 0) +
          Number(r.actualStockHrs || 0) +
          Number(r.actualPickHrs || 0) +
          Number(r.actualLoadVanHrs || 0);
        totalPlannedStops += Number(r.plannedStops || 0);
        totalActualStops += Number(r.actualStops || 0);
      }

      // Get operator rates to compute cost
      const rates = await db
        .select({
          operatorId: operatorRates.operator_id,
          hourlyRate: operatorRates.hourly_rate,
          gasRatePerHr: operatorRates.gas_rate_per_hr,
        })
        .from(operatorRates)
        .where(eq(operatorRates.business_id, teamId));

      const avgHourlyRate =
        rates.length > 0
          ? rates.reduce((s, r) => s + Number(r.hourlyRate), 0) / rates.length
          : 25;

      const estimatedLaborCost = Number((totalActualHrs > 0
        ? totalActualHrs * avgHourlyRate
        : totalPlannedHrs * avgHourlyRate
      ).toFixed(2));

      return JSON.stringify({
        type: "labor_costs",
        period: { from, to },
        total_planned_hours: Number(totalPlannedHrs.toFixed(2)),
        total_actual_hours: Number(totalActualHrs.toFixed(2)),
        total_planned_stops: totalPlannedStops,
        total_actual_stops: totalActualStops,
        avg_hourly_rate: avgHourlyRate,
        estimated_labor_cost: estimatedLaborCost,
        day_count: results.length,
      });
    }

    if (input.query_type === "capacity_alerts") {
      const results = await db
        .select({
          id: capacityAlerts.id,
          employeeId: capacityAlerts.employee_id,
          employeeName: employees.name,
          alertType: capacityAlerts.alert_type,
          message: capacityAlerts.message,
          currentUtilization: capacityAlerts.current_utilization,
          threshold: capacityAlerts.threshold,
          isRead: capacityAlerts.is_read,
          dismissedAt: capacityAlerts.dismissed_at,
          createdAt: capacityAlerts.created_at,
        })
        .from(capacityAlerts)
        .innerJoin(employees, eq(capacityAlerts.employee_id, employees.id))
        .where(
          and(
            eq(capacityAlerts.business_id, teamId),
            sql`${capacityAlerts.dismissed_at} IS NULL`,
          ),
        )
        .orderBy(desc(capacityAlerts.created_at))
        .limit(20);

      return JSON.stringify({
        type: "capacity_alerts",
        count: results.length,
        alerts: results,
      });
    }

    if (input.query_type === "operator_rates") {
      const results = await db
        .select({
          id: operatorRates.id,
          operatorId: operatorRates.operator_id,
          hourlyRate: operatorRates.hourly_rate,
          gasRatePerHr: operatorRates.gas_rate_per_hr,
        })
        .from(operatorRates)
        .where(eq(operatorRates.business_id, teamId))
        .limit(50);

      return JSON.stringify({
        type: "operator_rates",
        count: results.length,
        rates: results,
      });
    }

    return JSON.stringify({
      error: "Unknown query type",
      available: [
        "employees",
        "compensation_plans",
        "labor_costs",
        "capacity_alerts",
        "operator_rates",
      ],
    });
  } catch (error) {
    return `Unable to retrieve workforce data: ${error instanceof Error ? error.message : "An unexpected error occurred"}. Please try again.`;
  }
}
