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
import { WelcomeModal } from "@/components/welcome-modal";
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

  // reviewCount removed — was adding latency to every page load

  try {
    const caller = await getServerCaller();
    user = await caller.user.me();

    if (user) {
      queryClient.setQueryData(trpc.user.me.queryOptions().queryKey, user);
    }

    // team.current() is NOT awaited here — user.me() already returns teamId
    // and team data. Prefetch it for client hydration without blocking render.
    caller.team.current().then((teamData: any) => {
      if (teamData) {
        queryClient.setQueryData(
          trpc.team.current.queryOptions().queryKey,
          teamData,
        );
      }
    }).catch(() => {
      // Non-critical — client will fetch on demand
    });

    // Invoice defaults loaded client-side on demand (not blocking layout)
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

  // Onboarding redirect is handled client-side now (no blocking query needed)
  const shouldShowOnboarding = false;

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
        <WelcomeModal />
      </div>
    </HydrateClient>
  );
}
