"use client";

import { createClient } from "@vendcfo/supabase/client";
import { ArrowRight, BarChart3, MapPin, Route, Truck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const WELCOME_DISMISSED_KEY = "vendcfo-welcome-dismissed";

function isWelcomeDismissed(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(WELCOME_DISMISSED_KEY) === "true";
  } catch {
    return true;
  }
}

function persistWelcomeDismiss(): void {
  try {
    localStorage.setItem(WELCOME_DISMISSED_KEY, "true");
  } catch {
    // ignore
  }
}

function useTeamId(): string | null {
  const [teamId, setTeamId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function resolve() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) return;

        const { data } = await supabase
          .from("users")
          .select("team_id")
          .eq("id", userId)
          .single();

        if (data?.team_id) {
          setTeamId(data.team_id);
        }
      } catch {
        // auth or query failure
      }
    }

    resolve();
  }, []);

  return teamId;
}

async function isNewUser(teamId: string): Promise<boolean> {
  const supabase = createClient();
  const sb = supabase as any;

  const results = await Promise.allSettled([
    supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("team_id", teamId),
    supabase
      .from("bank_accounts")
      .select("id", { count: "exact", head: true })
      .eq("team_id", teamId),
    supabase
      .from("bank_connections")
      .select("id", { count: "exact", head: true })
      .eq("team_id", teamId),
    sb
      .from("locations")
      .select("id", { count: "exact", head: true })
      .eq("business_id", teamId),
    sb
      .from("machines")
      .select("id", { count: "exact", head: true })
      .eq("business_id", teamId),
    sb
      .from("routes")
      .select("id", { count: "exact", head: true })
      .eq("business_id", teamId),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("team_id", teamId),
  ]);

  for (const result of results) {
    if (result.status === "fulfilled") {
      const count = (result.value as { count: number | null }).count ?? 0;
      if (count > 0) return false;
    }
  }

  return true;
}

const highlights = [
  {
    icon: BarChart3,
    label: "Track revenue and expenses across all locations",
  },
  {
    icon: MapPin,
    label: "Manage locations, machines, and service schedules",
  },
  {
    icon: Route,
    label: "Optimize routes and monitor driver performance",
  },
  {
    icon: Truck,
    label: "Generate invoices and financial reports automatically",
  },
] as const;

export function WelcomeModal() {
  const teamId = useTeamId();
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!teamId || !mounted) return;
    if (isWelcomeDismissed()) return;

    let cancelled = false;

    isNewUser(teamId).then((isNew) => {
      if (!cancelled && isNew) {
        setVisible(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [teamId, mounted]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    persistWelcomeDismiss();
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
      <div className="w-full max-w-[440px] mx-4 rounded-lg border border-[#e6e6e6] bg-white shadow-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-lg font-semibold text-[#111]">
            Welcome to VendCFO
          </h2>
          <p className="mt-1.5 text-sm text-[#666] leading-relaxed">
            The financial command center for your vending business. Let's get you
            set up so you can start tracking revenue, managing routes, and
            growing your operation.
          </p>
        </div>

        {/* Highlights */}
        <div className="px-6 pb-4 space-y-3">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center gap-3 text-sm text-[#444]"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-md bg-[#f5f5f5] flex items-center justify-center">
                  <Icon size={16} strokeWidth={1.5} className="text-[#666]" />
                </div>
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>

        {/* Action */}
        <div className="px-6 pb-6 pt-2">
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full flex items-center justify-center gap-2 rounded-md bg-[#111] text-white text-sm font-medium px-4 min-h-[44px] hover:bg-[#333] transition-colors"
          >
            Get Started
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
