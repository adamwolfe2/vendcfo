"use client";

import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import type { DailyComparison } from "./productivity-dashboard";

const Chart = dynamic(() => import("./weekly-comparison-chart-inner"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[300px]">
      <Loader2 size={20} className="animate-spin text-[#999]" />
    </div>
  ),
});

interface Props {
  data: DailyComparison[];
  operatorName: string;
}

export function WeeklyComparisonChart({ data, operatorName }: Props) {
  if (data.length === 0 || data.every((d) => d.plannedHrs === 0 && d.actualHrs === 0)) {
    return (
      <div className="border border-dashed border-[#ddd] rounded-lg p-8 text-center">
        <p className="text-sm text-[#888]">
          No weekly plan data available for {operatorName}. Add planned and
          actual hours in the Routes page to see the comparison chart.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-[#e0e0e0] rounded-lg p-4">
      <Chart data={data} operatorName={operatorName} />
    </div>
  );
}
