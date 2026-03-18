import { ExportStatus } from "@/components/export-status";
import { GlobalTimerProvider } from "@/components/global-timer-provider";
import { Header } from "@/components/header";
import { GlobalSheetsProvider } from "@/components/sheets/global-sheets-provider";
import { Sidebar } from "@/components/sidebar";
import { TimezoneDetector } from "@/components/timezone-detector";
import { TrialGuard } from "@/components/trial-guard";
import {
  HydrateClient,
  getQueryClient,
  getServerCaller,
  trpc,
} from "@/trpc/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Demo user data for unauthenticated demo mode
const DEMO_USER = {
  id: "demo-user",
  email: "demo@vendcfo.ai",
  fullName: "Demo User",
  avatarUrl: null,
  teamId: "demo-team",
  locale: "en",
  weekStartsOnMonday: false,
  timezone: "America/New_York",
  dateFormat: "MM/dd/yyyy",
  timeFormat: 12,
  team: {
    id: "demo-team",
    name: "Demo Vending Co",
    plan: "trial" as const,
    createdAt: new Date().toISOString(),
    canceledAt: null,
    baseCurrency: "USD",
    email: "demo@vendcfo.ai",
    inboxEmail: null,
    logoUrl: null,
    inboxForwarding: false,
  },
};

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = getQueryClient();
  const cookieStore = await cookies();
  const isDemo =
    process.env.NEXT_PUBLIC_MOCK_UI === "true" ||
    cookieStore.get("vendcfo-demo")?.value === "true";

  let user: any = null;

  if (isDemo) {
    // Demo mode — use mock data, skip TRPC
    user = DEMO_USER;
  } else {
    try {
      const caller = await getServerCaller();
      user = await caller.user.me();

      if (user) {
        queryClient.setQueryData(
          trpc.user.me.queryOptions().queryKey,
          user,
        );
      }

      const [teamData, invoiceDefaults] = await Promise.allSettled([
        caller.team.current(),
        caller.invoice.defaultSettings(),
      ]);

      if (teamData.status === "fulfilled") {
        queryClient.setQueryData(
          trpc.team.current.queryOptions().queryKey,
          teamData.value,
        );
      }

      if (invoiceDefaults.status === "fulfilled") {
        queryClient.setQueryData(
          trpc.invoice.defaultSettings.queryOptions().queryKey,
          invoiceDefaults.value,
        );
      }
    } catch (error) {
      console.error("[sidebar/layout] TRPC caller error:", error);
      redirect("/login");
    }

    if (!user) {
      redirect("/login");
    }

    if (!user.fullName) {
      redirect("/setup");
    }

    if (!user.teamId) {
      redirect("/teams");
    }
  }

  return (
    <HydrateClient>
      <div className="relative">
        <Sidebar />

        <div className="md:ml-[70px] pb-4">
          <Header />
          <TrialGuard
            plan={user.team?.plan}
            createdAt={user.team?.createdAt}
            user={{ fullName: user.fullName }}
          >
            <div className="px-4 md:px-8">{children}</div>
          </TrialGuard>
        </div>

        <ExportStatus />
        <GlobalSheetsProvider />
        <GlobalTimerProvider />
        <TimezoneDetector />
      </div>
    </HydrateClient>
  );
}
