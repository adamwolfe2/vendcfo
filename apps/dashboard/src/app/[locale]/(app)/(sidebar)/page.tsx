import { ChatInterface } from "@/components/chat/chat-interface";
import { Widgets } from "@/components/widgets";
import {
  HydrateClient,
  getQueryClient,
  getServerCaller,
  trpc,
} from "@/trpc/server";
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
