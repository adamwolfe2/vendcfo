import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { getServerCaller } from "@/trpc/server";
import { Icons } from "@vendcfo/ui/icons";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Get Started | VendCFO",
};

export default async function OnboardingPage() {
  let user: any = null;
  let hasTransactions = false;

  try {
    const caller = await getServerCaller();
    user = await caller.user.me();

    if (!user?.id) {
      return redirect("/login");
    }

    if (!user.teamId) {
      return redirect("/teams");
    }

    // Check if user already has data — if so, skip onboarding
    try {
      const reviewCount = await caller.transactions.getReviewCount();
      hasTransactions = typeof reviewCount === "number" && reviewCount > 0;
    } catch {
      // If we can't check, continue to onboarding
    }
  } catch {
    return redirect("/login");
  }

  if (hasTransactions) {
    return redirect("/");
  }

  return (
    <div>
      <div className="absolute left-6 top-6">
        <Link href="/">
          <Icons.LogoSmall className="h-6 w-auto" />
        </Link>
      </div>

      <div className="flex min-h-screen justify-center items-center overflow-hidden p-6 md:p-0">
        <div className="relative z-20 m-auto flex w-full max-w-3xl flex-col">
          <OnboardingWizard />
        </div>
      </div>
    </div>
  );
}
