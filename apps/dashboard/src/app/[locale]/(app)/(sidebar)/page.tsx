import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Overview | VendCFO",
};

export default async function Overview() {
  const isMockMode = process.env.NEXT_PUBLIC_MOCK_UI === "true";

  if (isMockMode) {
    return (
      <div className="mt-6 px-2">
        <h1 className="text-2xl font-serif mb-6">Overview</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="border border-border p-6">
            <p className="text-sm text-[#878787] mb-1">Monthly Revenue</p>
            <p className="text-2xl font-medium">$23,583</p>
            <p className="text-xs text-green-600 mt-1">+12.4%</p>
          </div>
          <div className="border border-border p-6">
            <p className="text-sm text-[#878787] mb-1">Active Machines</p>
            <p className="text-2xl font-medium">71</p>
            <p className="text-xs text-green-600 mt-1">+8 this month</p>
          </div>
          <div className="border border-border p-6">
            <p className="text-sm text-[#878787] mb-1">Avg / Machine</p>
            <p className="text-2xl font-medium">$166</p>
            <p className="text-xs text-green-600 mt-1">+5.2%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="border border-border p-6">
            <h3 className="font-medium mb-4">Top Performing Machines</h3>
            <div className="space-y-3">
              {["Lobby A-1 (Snacks)", "Break Room B-3 (Drinks)", "Cafeteria C-2 (Combo)", "Entrance D-1 (Coffee)"].map((name, i) => (
                <div key={name} className="flex justify-between items-center text-sm">
                  <span>{name}</span>
                  <span className="font-medium">${(450 - i * 60).toLocaleString()}/mo</span>
                </div>
              ))}
            </div>
          </div>
          <div className="border border-border p-6">
            <h3 className="font-medium mb-4">Alerts</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                <span>Machine B-7 offline (2h ago)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span>Low stock: Lobby A-1 (3 items)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span>Low stock: Break Room B-3 (5 items)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Route A completed (all restocked)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-border p-6">
          <h3 className="font-medium mb-4">Recent Transactions</h3>
          <div className="space-y-2">
            {[
              { desc: "Vend sale - Machine A-1", amount: "+$3.50", time: "2 min ago" },
              { desc: "Vend sale - Machine C-2", amount: "+$2.75", time: "5 min ago" },
              { desc: "Restocking - Route A", amount: "-$142.00", time: "1h ago" },
              { desc: "Vend sale - Machine D-1", amount: "+$4.25", time: "1h ago" },
              { desc: "Maintenance - Machine B-7", amount: "-$85.00", time: "3h ago" },
            ].map((tx) => (
              <div key={tx.desc} className="flex justify-between items-center text-sm py-2 border-b border-border last:border-0">
                <div>
                  <p>{tx.desc}</p>
                  <p className="text-xs text-[#878787]">{tx.time}</p>
                </div>
                <span className={tx.amount.startsWith("+") ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                  {tx.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Real mode — use TRPC
  const { ChatInterface } = await import("@/components/chat/chat-interface");
  const { Widgets } = await import("@/components/widgets");
  const {
    HydrateClient,
    getQueryClient,
    getServerCaller,
    trpc,
  } = await import("@/trpc/server");
  const { Provider: ChatProvider } = await import("@ai-sdk-tools/store");
  const { geolocation } = await import("@vercel/functions");
  const { headers } = await import("next/headers");

  const headersList = await headers();
  const geo = geolocation({ headers: headersList });
  const queryClient = getQueryClient();

  let widgetPreferences: any = null;

  try {
    const caller = await getServerCaller();
    widgetPreferences = await caller.widgets.getWidgetPreferences();
    queryClient.setQueryData(
      trpc.widgets.getWidgetPreferences.queryOptions().queryKey,
      widgetPreferences,
    );

    const suggestedActions = await caller.suggestedActions.list({ limit: 6 });
    queryClient.setQueryData(
      trpc.suggestedActions.list.queryOptions({ limit: 6 }).queryKey,
      suggestedActions,
    );
  } catch (error) {
    console.error("[overview] TRPC caller error:", error);
  }

  return (
    <HydrateClient>
      <ChatProvider initialMessages={[]} key="home">
        <Widgets initialPreferences={widgetPreferences} />
        <ChatInterface geo={geo} />
      </ChatProvider>
    </HydrateClient>
  );
}
