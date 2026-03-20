import { SetupForm } from "@/components/setup-form";
import { getQueryClient, getServerCaller, trpc } from "@/trpc/server";
import { HydrateClient } from "@/trpc/server";
import { Icons } from "@vendcfo/ui/icons";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Setup account | VendCFO",
};

export default async function Page() {
  const queryClient = getQueryClient();

  let user: any = null;
  try {
    const caller = await getServerCaller();
    user = await caller.user.me();

    if (user) {
      queryClient.setQueryData(trpc.user.me.queryOptions().queryKey, user);
    }
  } catch {
    return redirect("/login");
  }

  if (!user?.id) {
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
        <div className="relative z-20 m-auto flex w-full max-w-[380px] flex-col">
          <div className="text-center">
            <h1 className="text-lg mb-2 font-serif">Update your account</h1>
            <p className="text-[#878787] text-sm mb-8">
              Add your name and an optional avatar.
            </p>
          </div>

          <HydrateClient>
            <SetupForm />
          </HydrateClient>
        </div>
      </div>
    </div>
  );
}
