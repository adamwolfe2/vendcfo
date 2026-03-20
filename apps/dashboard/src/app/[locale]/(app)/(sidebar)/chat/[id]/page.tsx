import { ChatInterface } from "@/components/chat/chat-interface";
import { Widgets } from "@/components/widgets";
import { HydrateClient, getQueryClient, trpc } from "@/trpc/server";
import { getServerCaller } from "@/trpc/server";
import { Provider as ChatProvider } from "@ai-sdk-tools/store";
import { geolocation } from "@vercel/functions";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Chat | VendCFO",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ChatPage(props: Props) {
  const { id } = await props.params;

  const headersList = await headers();
  const geo = geolocation({
    headers: headersList,
  });

  const queryClient = getQueryClient();

  try {
    const caller = await getServerCaller();

    // Fetch widget preferences and chat data via direct caller
    const [widgetPreferences, chat, suggestedActions] =
      await Promise.allSettled([
        caller.widgets.getWidgetPreferences(),
        caller.chats.get({ chatId: id }),
        caller.suggestedActions.list({ limit: 6 }),
      ]);

    // Populate cache for widget preferences
    if (widgetPreferences.status === "fulfilled") {
      queryClient.setQueryData(
        trpc.widgets.getWidgetPreferences.queryOptions().queryKey,
        widgetPreferences.value,
      );
    }

    // Populate cache for suggested actions
    if (suggestedActions.status === "fulfilled") {
      queryClient.setQueryData(
        trpc.suggestedActions.list.queryOptions({ limit: 6 }).queryKey,
        suggestedActions.value,
      );
    }

    // Populate cache for chat
    if (chat.status === "fulfilled") {
      queryClient.setQueryData(
        trpc.chats.get.queryOptions({ chatId: id }).queryKey,
        chat.value,
      );
    }

    const chatData = chat.status === "fulfilled" ? chat.value : null;
    const widgetPrefsData =
      widgetPreferences.status === "fulfilled"
        ? widgetPreferences.value
        : undefined;

    if (!chatData) {
      redirect("/");
    }

    return (
      <HydrateClient>
        <ChatProvider initialMessages={chatData} key={id}>
          <Widgets initialPreferences={widgetPrefsData} />

          <ChatInterface geo={geo} />
        </ChatProvider>
      </HydrateClient>
    );
  } catch (error) {
    console.error("[ChatPage] Failed to fetch data via direct caller:", error);
    redirect("/");
  }
}
