"use client";

function getUtilizationColor(pct: number): string {
  if (pct < 70) return "bg-green-500";
  if (pct < 85) return "bg-yellow-500";
  return "bg-red-500";
}

function getUtilizationBg(pct: number): string {
  if (pct < 70) return "bg-green-100";
  if (pct < 85) return "bg-yellow-100";
  return "bg-red-100";
}

function getUtilizationLabel(pct: number): string {
  if (pct < 70) return "Available";
  if (pct < 85) return "Busy";
  if (pct < 100) return "Near Capacity";
  return "Over Capacity";
}

export function UtilizationBar({
  utilization,
  showLabel = true,
}: {
  utilization: number;
  showLabel?: boolean;
}) {
  const clampedWidth = Math.min(utilization, 100);

  return (
    <div className="flex items-center gap-3">
      <div className={`flex-1 h-2.5 rounded-full ${getUtilizationBg(utilization)}`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${getUtilizationColor(utilization)}`}
          style={{ width: `${clampedWidth}%` }}
        />
      </div>
      <span className="text-xs tabular-nums font-medium min-w-[40px] text-right">
        {utilization.toFixed(0)}%
      </span>
      {showLabel && (
        <span className="text-xs text-[#888] min-w-[80px]">
          {getUtilizationLabel(utilization)}
        </span>
      )}
    </div>
  );
}
