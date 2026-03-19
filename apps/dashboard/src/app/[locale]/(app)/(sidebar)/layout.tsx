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
    console.log("[sidebar/layout] user.me result:", user ? { id: user.id, teamId: user.teamId, fullName: user.fullName } : "null");

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
    const msg = error instanceof Error ? error.message : String(error);
    // NEXT_REDIRECT is thrown by Next.js redirect() — rethrow it, don't catch
    if (msg === "NEXT_REDIRECT" || (error as any)?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("[sidebar/layout] TRPC caller error:", msg);
    console.error("[sidebar/layout] ENV check — SUPABASE_URL:", !!process.env.SUPABASE_URL, "SUPABASE_JWT_SECRET:", !!process.env.SUPABASE_JWT_SECRET, "DATABASE_PRIMARY_URL:", !!process.env.DATABASE_PRIMARY_URL, "SUPABASE_SERVICE_KEY:", !!process.env.SUPABASE_SERVICE_KEY);
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
