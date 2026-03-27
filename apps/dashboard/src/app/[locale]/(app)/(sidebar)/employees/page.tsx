import { EmployeesPage } from "@/components/workforce/employees-page";
import { getServerCaller } from "@/trpc/server";
import { createClient } from "@vendcfo/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Employees | VendCFO",
};

export default async function Page() {
  let teamId: string | null = null;

  try {
    const caller = await getServerCaller();
    const user = await caller.user.me();
    if (!user?.teamId) redirect("/teams");
    teamId = user.teamId;
  } catch {
    redirect("/login");
  }

  let employees: any[] = [];
  let plans: any[] = [];

  try {
    const supabase = await createClient() as any;
    const [employeesRes, plansRes] = await Promise.all([
      supabase
        .from("employees")
        .select("*")
        .eq("business_id", teamId)
        .order("name", { ascending: true }),
      supabase
        .from("compensation_plans")
        .select("*")
        .eq("business_id", teamId)
        .order("effective_from", { ascending: false }),
    ]);
    employees = employeesRes.data || [];
    plans = plansRes.data || [];
  } catch {
    // Tables may not exist yet — render empty
  }

  return (
    <EmployeesPage
      initialData={employees}
      initialPlans={plans}
      teamId={teamId!}
    />
  );
}
