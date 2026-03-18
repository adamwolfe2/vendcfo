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
import { redirect } from "next/navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = getQueryClient();

  let user: any = null;

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
