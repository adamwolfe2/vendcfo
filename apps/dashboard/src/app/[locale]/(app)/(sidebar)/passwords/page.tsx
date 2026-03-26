import { PasswordVault } from "@/components/passwords/password-vault";
import { getServerCaller } from "@/trpc/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Password Vault | VendCFO",
};

export default async function Page() {
  let teamId: string | null = null;
  let userId: string | null = null;
  try {
    const caller = await getServerCaller();
    const user = await caller.user.me();
    if (!user?.teamId) redirect("/teams");
    teamId = user.teamId;
    userId = user.id;
  } catch {
    redirect("/login");
  }

  return <PasswordVault teamId={teamId} userId={userId!} />;
}
