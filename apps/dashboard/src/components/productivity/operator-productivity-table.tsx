"use client";

import type { OperatorProductivity } from "./productivity-dashboard";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatHours(hours: number): string {
  return `${hours.toFixed(1)}h`;
}

function varianceColor(variance: number): string {
  if (variance > 0.5) return "text-red-600";
  if (variance < -0.5) return "text-green-600";
  return "text-[#333]";
}

function variancePrefix(variance: number): string {
  if (variance > 0) return "+";
  return "";
}

function efficiencyColor(score: number): string {
  if (score === 0) return "text-[#999]";
  if (score > 110) return "text-red-600";
  if (score >= 90) return "text-green-600";
  return "text-yellow-600";
}

function efficiencyBg(score: number): string {
  if (score === 0) return "bg-gray-100";
  if (score > 110) return "bg-red-50";
  if (score >= 90) return "bg-green-50";
  return "bg-yellow-50";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  data: OperatorProductivity[];
  selectedOperatorId: string | null;
  onSelectOperator: (id: string) => void;
}

export function OperatorProductivityTable({
  data,
  selectedOperatorId,
  onSelectOperator,
}: Props) {
  if (data.length === 0) {
    return (
      <div className="border border-dashed border-[#ddd] rounded-lg p-8 text-center">
        <p className="text-sm text-[#888]">
          No active employees found. Add employees in the Workforce section to
          begin tracking productivity.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-[#e0e0e0] rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
              <th className="text-left px-4 py-3 text-xs font-medium text-[#666]">
                Operator
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[#666]">
                Planned Stops
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[#666]">
                Actual Stops
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[#666]">
                Planned Hrs
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[#666]">
                Actual Hrs
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[#666]">
                Variance
              </th>
              <th className="text-center px-4 py-3 text-xs font-medium text-[#666]">
                Efficiency
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((op) => {
              const isSelected = selectedOperatorId === op.operatorId;
              return (
                <tr
                  key={op.operatorId}
                  onClick={() => onSelectOperator(op.operatorId)}
                  className={`border-b border-[#f0f0f0] last:border-b-0 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-blue-50 hover:bg-blue-50"
                      : "hover:bg-[#fafafa]"
                  }`}
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-sm">{op.name}</p>
                      <p className="text-xs text-[#888]">{op.role}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {op.plannedStops}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <span>{op.actualStops}</span>
                    {op.stopsVariance !== 0 && (
                      <span
                        className={`ml-1 text-xs ${varianceColor(op.stopsVariance)}`}
                      >
                        ({variancePrefix(op.stopsVariance)}
                        {op.stopsVariance})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatHours(op.totalPlannedHrs)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatHours(op.totalActualHrs)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right tabular-nums font-medium ${varianceColor(op.hoursVariance)}`}
                  >
                    {variancePrefix(op.hoursVariance)}
                    {formatHours(op.hoursVariance)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums ${efficiencyColor(op.efficiencyScore)} ${efficiencyBg(op.efficiencyScore)}`}
                    >
                      {op.efficiencyScore > 0
                        ? `${op.efficiencyScore}%`
                        : "--"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="border-t border-[#e0e0e0] bg-[#fafafa] px-4 py-3">
        <p className="text-xs text-[#888]">
          Efficiency = actual hours / planned hours. Green (90-110%) is on
          target. Red (&gt;110%) indicates over plan. Click a row to view daily
          breakdown.
        </p>
      </div>
    </div>
  );
}
