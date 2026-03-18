import { ManageSubscription } from "@/components/manage-subscription";
import { Orders } from "@/components/orders";
import { Plans } from "@/components/plans";
import { prefetch, trpc } from "@/trpc/server";
import { getQueryClient } from "@/trpc/server";
import { getServerCaller } from "@/trpc/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Billing | VendCFO",
};

export default async function Billing() {
  const queryClient = getQueryClient();

  let user: Awaited<ReturnType<Awaited<ReturnType<typeof getServerCaller>>["user"]["me"]>> | null = null;

  try {
    const caller = await getServerCaller();
    user = await caller.user.me();
    queryClient.setQueryData(
      trpc.user.me.queryOptions().queryKey,
      user,
    );
  } catch (error) {
    console.error("[BillingPage] Failed to fetch user via direct caller:", error);
  }

  const team = user?.team;

  // Infinite query — leave as prefetch but wrap in try/catch
  try {
    prefetch(
      trpc.billing.orders.infiniteQueryOptions({
        pageSize: 15,
      }),
    );
  } catch (error) {
    console.error("[BillingPage] Failed to prefetch billing orders:", error);
  }

  return (
    <div className="space-y-12">
      {team?.plan !== "trial" && <ManageSubscription />}

      {team?.plan === "trial" && (
        <div>
          <h2 className="text-lg font-medium leading-none tracking-tight mb-4">
            Plans
          </h2>

          <Plans />
        </div>
      )}

      {(team?.plan !== "trial" || team?.canceledAt !== null) && <Orders />}
    </div>
  );
}
