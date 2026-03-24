"use client";

import { UtilizationBar } from "./utilization-bar";

interface EmployeeCapacity {
  employeeId: string;
  name: string;
  role: string;
  employmentType: string;
  assignedStopsPerWeek: number;
  maxWeeklyHours: number;
  totalPlannedHours: number;
  drivingHours: number;
  warehouseHours: number;
  loadVanHours: number;
  stockHours: number;
  pickHours: number;
  utilization: number;
}

function formatHours(hours: number): string {
  return `${hours.toFixed(1)}h`;
}

function EmploymentBadge({ type }: { type: string }) {
  const label =
    type === "w2" || type === "full_time"
      ? "Full-time"
      : type === "part_time"
        ? "Part-time"
        : "Contractor";
  const color =
    type === "w2" || type === "full_time"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : type === "part_time"
        ? "bg-purple-50 text-purple-700 border-purple-200"
        : "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${color}`}
    >
      {label}
    </span>
  );
}

export function EmployeeCapacityTable({
  data,
}: {
  data: EmployeeCapacity[];
}) {
  if (data.length === 0) {
    return (
      <div className="border border-dashed border-[#ddd] rounded-lg p-8 text-center">
        <p className="text-sm text-[#888]">
          No employees found. Add employees in the Operations section to see
          capacity planning data.
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
                Employee
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#666]">
                Type
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[#666]">
                Stops / wk
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[#666]">
                Planned
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[#666]">
                Capacity
              </th>
              <th className="px-4 py-3 text-xs font-medium text-[#666] min-w-[220px]">
                Utilization
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((emp) => (
              <tr
                key={emp.employeeId}
                className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafafa] transition-colors"
              >
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-sm">{emp.name}</p>
                    <p className="text-xs text-[#888]">{emp.role}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <EmploymentBadge type={emp.employmentType} />
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {emp.assignedStopsPerWeek}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatHours(emp.totalPlannedHours)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatHours(emp.maxWeeklyHours)}
                </td>
                <td className="px-4 py-3">
                  <UtilizationBar utilization={emp.utilization} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hour breakdown detail */}
      <div className="border-t border-[#e0e0e0] bg-[#fafafa] px-4 py-3">
        <p className="text-xs text-[#888]">
          Planned hours include: driving, warehouse prep, loading van, stocking,
          and picking. Utilization = planned hours / max weekly capacity.
        </p>
      </div>
    </div>
  );
}
