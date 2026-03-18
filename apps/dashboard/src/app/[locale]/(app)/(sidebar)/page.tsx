import { ChatInterface } from "@/components/chat/chat-interface";
import { KpiCards } from "@/components/vending/kpi-cards";
import { PnlChart } from "@/components/vending/pnl-chart";
import { RouteTable } from "@/components/vending/route-table";
import { HydrateClient, getQueryClient, prefetch, trpc } from "@/trpc/server";
import { Provider as ChatProvider } from "@ai-sdk-tools/store";
import { geolocation } from "@vercel/functions";
import type { Metadata } from "next";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "Overview | VendCFO",
};

export default async function Overview() {
  const headersList = await headers();
  const geo = geolocation({
    headers: headersList,
  });

  const queryClient = getQueryClient();

  // Fetch widget preferences directly for initial data (no prefetch needed)
  const widgetPreferences = await queryClient.fetchQuery(
    trpc.widgets.getWidgetPreferences.queryOptions(),
  );

  // Prefetch suggested actions (metrics are prefetched client-side to respect localStorage)
  prefetch(trpc.suggestedActions.list.queryOptions({ limit: 6 }));

  return (
    <HydrateClient>
      <ChatProvider initialMessages={[]} key="home">
        <div className="flex flex-col flex-1 p-6 max-w-7xl mx-auto w-full">
          <h1 className="text-2xl font-bold text-foreground mb-6">VendCFO Overview</h1>
          <KpiCards />
          <PnlChart />
          <div className="grid grid-cols-1 gap-6">
            <RouteTable />
          </div>
        </div>
        <ChatInterface geo={geo} />
      </ChatProvider>
    </HydrateClient>
  );
}
