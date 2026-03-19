"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const ONBOARDING_COMPLETE_KEY = "vendcfo-onboarding-complete";

/**
 * Client component that redirects to /onboarding if the user
 * has not previously dismissed the onboarding wizard.
 *
 * This is rendered conditionally by the sidebar layout only when
 * the server determines the team is new and has no transactions.
 * The localStorage check prevents showing onboarding again after
 * the user has completed or skipped it.
 */
export function OnboardingRedirect() {
  const router = useRouter();

  useEffect(() => {
    try {
      const completed = localStorage.getItem(ONBOARDING_COMPLETE_KEY);
      if (completed !== "true") {
        router.replace("/onboarding");
      }
    } catch {
      // localStorage not available — don't redirect
    }
  }, [router]);

  return null;
}
