import { BetaFeedback } from "@/components/beta-feedback";
import { ExportStatus } from "@/components/export-status";
import { GlobalTimerProvider } from "@/components/global-timer-provider";
import { Header } from "@/components/header";
import { OnboardingChatPrompt } from "@/components/onboarding/onboarding-chat-prompt";
import { OnboardingRedirect } from "@/components/onboarding/onboarding-redirect";
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
  let callerError: string | null = null;

  let reviewCount: number | null = null;

  try {
    const caller = await getServerCaller();
    user = await caller.user.me();

    if (user) {
      queryClient.setQueryData(trpc.user.me.queryOptions().queryKey, user);
    }

    // Parallelize all independent data fetches (team, invoice defaults,
    // and the onboarding review-count check) into a single Promise.allSettled.
    const [teamData, invoiceDefaults, reviewCountResult] =
      await Promise.allSettled([
        caller.team.current(),
        caller.invoice.defaultSettings(),
        // Only fetch review count if the team was recently created (for onboarding check).
        // This avoids an extra sequential DB call later.
        user?.team?.createdAt &&
        new Date(user.team.createdAt) > new Date(Date.now() - 60 * 60 * 1000)
          ? caller.transactions.getReviewCount()
          : Promise.resolve(null),
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

    if (reviewCountResult.status === "fulfilled") {
      reviewCount = reviewCountResult.value;
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    // NEXT_REDIRECT is thrown by Next.js redirect() — rethrow, don't catch
    if (
      msg === "NEXT_REDIRECT" ||
      (error as any)?.digest?.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    console.error("[sidebar/layout] TRPC error:", msg);
    console.error(
      "[sidebar/layout] Stack:",
      error instanceof Error ? error.stack : "no stack",
    );

    // Only redirect to /login for actual auth errors.
    // For all other errors (DB, network, etc.), show the error to the user
    // instead of creating a redirect loop.
    if (msg.includes("UNAUTHORIZED") || msg.includes("Not authenticated")) {
      redirect("/login");
    }

    // For non-auth errors, store the error and show a helpful page
    callerError = msg;
  }

  // If we got a non-auth error, show it instead of looping to /login
  if (callerError) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="max-w-lg w-full text-center px-4">
          <h2 className="text-lg font-medium mb-4">Unable to load dashboard</h2>
          <p className="text-sm text-[#878787] mb-4">
            The server encountered an error connecting to backend services. This
            is usually temporary.
          </p>
          <pre className="text-xs text-left bg-[#f5f5f5] p-4 rounded mb-6 overflow-auto max-h-40 whitespace-pre-wrap">
            {callerError}
          </pre>
          <a
            href="/"
            className="inline-block px-4 py-2 border border-[#ddd] rounded text-sm hover:bg-[#f5f5f5] transition-colors"
          >
            Try again
          </a>
        </div>
      </div>
    );
  }

  if (!user) {
    // User is authenticated (passed middleware) but has no user record.
    // Redirect to teams/create which will trigger user provisioning.
    redirect("/teams/create");
  }

  if (!user.fullName) {
    redirect("/setup");
  }

  if (!user.teamId) {
    redirect("/teams");
  }

  // Check if this is a brand-new team that should see onboarding.
  // reviewCount was already fetched in parallel above for recent teams.
  const shouldShowOnboarding =
    typeof reviewCount === "number" && reviewCount === 0;

  return (
    <HydrateClient>
      <div className="relative">
        <Sidebar />
        {shouldShowOnboarding && <OnboardingRedirect />}

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
        <OnboardingChatPrompt />
        <BetaFeedback />
      </div>
    </HydrateClient>
  );
}
