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

interface RouteRevenue {
  route_id: string;
  route_name: string;
  total: number;
}

async function fetchRoutePerformance(
  teamId: string,
  from: string,
  to: string,
): Promise<RouteRevenue[]> {
  const supabase: any = createClient();

  // Fetch routes for this business
  const { data: routes } = await supabase
    .from("routes")
    .select("id, name")
    .eq("business_id", teamId)
    .eq("is_active", true);

  if (!routes || routes.length === 0) return [];

  // Fetch revenue records within the date range
  const { data: revenueRecords } = await supabase
    .from("revenue_records")
    .select("route_id, cash_amount, card_amount")
    .eq("business_id", teamId)
    .gte("collection_date", from)
    .lte("collection_date", to);

  if (!revenueRecords || revenueRecords.length === 0) {
    return routes.slice(0, 3).map((r: any) => ({
      route_id: r.id,
      route_name: r.name,
      total: 0,
    }));
  }

  // Build a map of route name by id
  const routeMap = new Map<string, string>(routes.map((r: any) => [r.id, r.name]));

  // Aggregate revenue per route
  const revByRoute = new Map<string, number>();
  for (const rec of revenueRecords) {
    if (!rec.route_id) continue;
    const current = revByRoute.get(rec.route_id) ?? 0;
    revByRoute.set(
      rec.route_id,
      current + (Number(rec.cash_amount) || 0) + (Number(rec.card_amount) || 0),
    );
  }

  // Convert to sorted array
  const result: RouteRevenue[] = [];
  for (const [routeId, total] of revByRoute.entries()) {
    const name = routeMap.get(routeId);
    if (name) {
      result.push({ route_id: routeId, route_name: name, total });
    }
  }

  // Include routes with 0 revenue if fewer than 3 results
  if (result.length < 3) {
    for (const route of routes) {
      if (!revByRoute.has(route.id) && result.length < 3) {
        result.push({
          route_id: route.id,
          route_name: route.name,
          total: 0,
        });
      }
    }
  }

  return result.sort((a, b) => b.total - a.total).slice(0, 3);
}

export function RoutePerformanceWidget() {
  const { data: user } = useUserQuery();
  const { from, to, currency } = useMetricsFilter();

  const { data, isLoading } = useQuery({
    queryKey: ["route-performance", user?.teamId, from, to],
    queryFn: () => fetchRoutePerformance(user!.teamId!, from, to),
    enabled: !!user?.teamId,
    ...WIDGET_POLLING_CONFIG,
  });

  if (isLoading || !data) {
    return (
      <WidgetSkeleton
        title="Route Performance"
        icon={<Icons.TrendingUp className="size-4" />}
        descriptionLines={3}
        showValue={false}
      />
    );
  }

  const maxRevenue = Math.max(...data.map((r) => r.total), 1);

  return (
    <BaseWidget
      title="Route Performance"
      icon={<Icons.TrendingUp className="size-4" />}
      description={
        <p className="text-sm text-[#666666]">Top routes by revenue</p>
      }
      actions="View all routes"
      onClick={() => {
        window.location.href = "/operations?tab=routes";
      }}
    >
      <div className="flex flex-col gap-2">
        {data.length === 0 ? (
          <p className="text-xs text-[#999999]">No routes configured</p>
        ) : (
          data.map((route, index) => (
            <div key={route.route_id} className="flex items-center gap-2">
              <span className="text-xs text-[#999999] w-3 shrink-0">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-[#333333] truncate">
                    {route.route_name}
                  </span>
                  <span className="text-xs font-mono text-[#555555] shrink-0">
                    <FormatAmount
                      amount={route.total}
                      currency={currency || "USD"}
                      minimumFractionDigits={0}
                      maximumFractionDigits={0}
                    />
                  </span>
                </div>
                <div className="mt-0.5 h-1 rounded-full bg-[#f0f0f0] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#333333]"
                    style={{
                      width: `${(route.total / maxRevenue) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </BaseWidget>
  );
}
