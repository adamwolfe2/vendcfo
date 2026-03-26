"use client";

import { FormatAmount } from "@/components/format-amount";
import { useMetricsFilter } from "@/hooks/use-metrics-filter";
import { useUserQuery } from "@/hooks/use-user";
import { createClient } from "@vendcfo/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Icons } from "@vendcfo/ui/icons";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSkeleton } from "./widget-skeleton";

interface VendingStats {
  totalRevenue: number;
  previousRevenue: number;
  activeLocations: number;
  activeMachines: number;
}

async function fetchVendingStats(
  teamId: string,
  from: string,
  to: string,
): Promise<VendingStats> {
  const supabase = createClient();

  // Current period revenue from revenue_records
  const { data: currentRevenue } = await supabase
    .from("revenue_records")
    .select("cash_amount, card_amount")
    .eq("business_id", teamId)
    .gte("collection_date", from)
    .lte("collection_date", to);

  const totalRevenue = (currentRevenue ?? []).reduce(
    (sum, r) =>
      sum + (Number(r.cash_amount) || 0) + (Number(r.card_amount) || 0),
    0,
  );

  // Previous period revenue (same duration, shifted back)
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const durationMs = toDate.getTime() - fromDate.getTime();
  const prevFrom = new Date(fromDate.getTime() - durationMs)
    .toISOString()
    .slice(0, 10);
  const prevTo = new Date(fromDate.getTime() - 1).toISOString().slice(0, 10);

  const { data: prevRevenue } = await supabase
    .from("revenue_records")
    .select("cash_amount, card_amount")
    .eq("business_id", teamId)
    .gte("collection_date", prevFrom)
    .lte("collection_date", prevTo);

  const previousRevenue = (prevRevenue ?? []).reduce(
    (sum, r) =>
      sum + (Number(r.cash_amount) || 0) + (Number(r.card_amount) || 0),
    0,
  );

  // Active locations count
  const { count: activeLocations } = await supabase
    .from("locations")
    .select("id", { count: "exact", head: true })
    .eq("business_id", teamId)
    .eq("is_active", true);

  // Active machines count
  const { count: activeMachines } = await supabase
    .from("machines")
    .select("id", { count: "exact", head: true })
    .eq("business_id", teamId)
    .eq("is_active", true);

  return {
    totalRevenue,
    previousRevenue,
    activeLocations: activeLocations ?? 0,
    activeMachines: activeMachines ?? 0,
  };
}

export function VendingRevenueWidget() {
  const { data: user } = useUserQuery();
  const { from, to, currency } = useMetricsFilter();

  const { data, isLoading } = useQuery({
    queryKey: ["vending-revenue", user?.teamId, from, to],
    queryFn: () => fetchVendingStats(user!.teamId!, from, to),
    enabled: !!user?.teamId,
    ...WIDGET_POLLING_CONFIG,
  });

  if (isLoading || !data) {
    return (
      <WidgetSkeleton
        title="Vending Revenue"
        icon={<Icons.Currency className="size-4" />}
        descriptionLines={2}
      />
    );
  }

  const changePercent =
    data.previousRevenue > 0
      ? ((data.totalRevenue - data.previousRevenue) / data.previousRevenue) *
        100
      : 0;

  const changeLabel =
    changePercent > 0
      ? `+${changePercent.toFixed(1)}%`
      : changePercent < 0
        ? `${changePercent.toFixed(1)}%`
        : "No change";

  return (
    <BaseWidget
      title="Vending Revenue"
      icon={<Icons.Currency className="size-4" />}
      description={
        <div className="flex flex-col gap-1">
          <p className="text-sm text-[#666666]">
            {changeLabel} vs prior period
          </p>
          <div className="flex items-center gap-3 text-xs text-[#999999]">
            <span>{data.activeLocations} locations</span>
            <span>{data.activeMachines} machines</span>
          </div>
        </div>
      }
      actions="View vending details"
      onClick={() => {
        window.location.href = "/operations";
      }}
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-normal">
          <FormatAmount
            amount={data.totalRevenue}
            currency={currency || "USD"}
          />
        </h2>
      </div>
    </BaseWidget>
  );
}
