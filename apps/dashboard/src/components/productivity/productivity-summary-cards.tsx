"use client";

import { Activity, Clock, Target, TrendingDown } from "lucide-react";
import type { OperatorProductivity } from "./productivity-dashboard";

interface Props {
  operators: OperatorProductivity[];
}

export function ProductivitySummaryCards({ operators }: Props) {
  const operatorsWithData = operators.filter(
    (op) => op.totalPlannedHrs > 0 || op.totalActualHrs > 0,
  );

  const totalPlannedHrs = operatorsWithData.reduce(
    (sum, op) => sum + op.totalPlannedHrs,
    0,
  );
  const totalActualHrs = operatorsWithData.reduce(
    (sum, op) => sum + op.totalActualHrs,
    0,
  );
  const avgEfficiency =
    operatorsWithData.length > 0
      ? Math.round(
          operatorsWithData.reduce((sum, op) => sum + op.efficiencyScore, 0) /
            operatorsWithData.length,
        )
      : 0;
  const overPlannedCount = operatorsWithData.filter(
    (op) => op.hoursVariance > 0,
  ).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
      <div className="border border-[#e0e0e0] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={16} strokeWidth={1.5} className="text-[#999]" />
          <span className="text-xs text-[#878787] font-medium">
            Planned Hours
          </span>
        </div>
        <p className="text-2xl font-bold tabular-nums">
          {totalPlannedHrs.toFixed(1)}h
        </p>
        <p className="text-xs text-[#888] mt-1">
          across {operatorsWithData.length} operator
          {operatorsWithData.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="border border-[#e0e0e0] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={16} strokeWidth={1.5} className="text-[#999]" />
          <span className="text-xs text-[#878787] font-medium">
            Actual Hours
          </span>
        </div>
        <p className="text-2xl font-bold tabular-nums">
          {totalActualHrs.toFixed(1)}h
        </p>
        <p className="text-xs text-[#888] mt-1">
          {totalActualHrs > totalPlannedHrs ? (
            <span className="text-red-600">
              +{(totalActualHrs - totalPlannedHrs).toFixed(1)}h over plan
            </span>
          ) : totalActualHrs < totalPlannedHrs ? (
            <span className="text-green-600">
              {(totalActualHrs - totalPlannedHrs).toFixed(1)}h under plan
            </span>
          ) : (
            "on target"
          )}
        </p>
      </div>

      <div className="border border-[#e0e0e0] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target size={16} strokeWidth={1.5} className="text-[#999]" />
          <span className="text-xs text-[#878787] font-medium">
            Avg Efficiency
          </span>
        </div>
        <p
          className={`text-2xl font-bold tabular-nums ${
            avgEfficiency > 110
              ? "text-red-600"
              : avgEfficiency >= 90
                ? "text-green-600"
                : avgEfficiency > 0
                  ? "text-yellow-600"
                  : ""
          }`}
        >
          {avgEfficiency}%
        </p>
        <p className="text-xs text-[#888] mt-1">actual / planned ratio</p>
      </div>

      <div className="border border-[#e0e0e0] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingDown size={16} strokeWidth={1.5} className="text-[#999]" />
          <span className="text-xs text-[#878787] font-medium">
            Over Plan
          </span>
        </div>
        <p
          className={`text-2xl font-bold ${
            overPlannedCount > 0 ? "text-red-600" : "text-green-600"
          }`}
        >
          {overPlannedCount}
        </p>
        <p className="text-xs text-[#888] mt-1">
          {overPlannedCount > 0
            ? "operators exceeding planned hours"
            : "all operators within plan"}
        </p>
      </div>
    </div>
  );
}
