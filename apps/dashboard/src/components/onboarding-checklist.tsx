"use client";

import { createClient } from "@vendcfo/supabase/client";
import { cn } from "@vendcfo/ui/cn";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Loader2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DISMISS_KEY = "vendcfo-onboarding-dismissed";

interface StepDefinition {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly href: string;
}

const steps: readonly StepDefinition[] = [
  {
    id: "import-data",
    label: "Import your financial data",
    description: "Connect QuickBooks or upload a spreadsheet",
    href: "/import",
  },
  {
    id: "add-location",
    label: "Add your first location",
    description: "Where your machines are placed",
    href: "/locations",
  },
  {
    id: "add-machine",
    label: "Add a vending machine",
    description: "Track each machine's performance",
    href: "/machines",
  },
  {
    id: "set-up-route",
    label: "Set up a route",
    description: "Organize locations into service routes",
    href: "/routes",
  },
  {
    id: "create-invoice",
    label: "Create your first invoice",
    description: "Bill a location or customer",
    href: "/invoices",
  },
] as const;

// ---------------------------------------------------------------------------
// Completion detection — queries Supabase for real counts
// ---------------------------------------------------------------------------

interface CompletionCounts {
  transactions: number;
  bankAccounts: number;
  locations: number;
  machines: number;
  routes: number;
  invoices: number;
}

async function fetchCompletionCounts(
  teamId: string,
): Promise<CompletionCounts> {
  const supabase = createClient();
  // Cast to any for vending tables not yet in generated Supabase types
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

  function extractCount(
    result: PromiseSettledResult<{ count: number | null }>,
  ): number {
    if (result.status === "fulfilled") {
      return result.value.count ?? 0;
    }
    return 0;
  }

  type CountResult = PromiseSettledResult<{ count: number | null }>;

  return {
    transactions: extractCount(results[0] as CountResult),
    bankAccounts: extractCount(results[1] as CountResult),
    locations: extractCount(results[2] as CountResult),
    machines: extractCount(results[3] as CountResult),
    routes: extractCount(results[4] as CountResult),
    invoices: extractCount(results[5] as CountResult),
  };
}

function deriveCompleted(counts: CompletionCounts): Set<string> {
  const completed = new Set<string>();
  if (counts.transactions > 0 || counts.bankAccounts > 0) completed.add("import-data");
  if (counts.locations > 0) completed.add("add-location");
  if (counts.machines > 0) completed.add("add-machine");
  if (counts.routes > 0) completed.add("set-up-route");
  if (counts.invoices > 0) completed.add("create-invoice");
  return completed;
}

// ---------------------------------------------------------------------------
// Dismiss persistence (localStorage only — lightweight)
// ---------------------------------------------------------------------------

function isDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(DISMISS_KEY) === "true";
  } catch {
    return false;
  }
}

function persistDismiss() {
  try {
    localStorage.setItem(DISMISS_KEY, "true");
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Hook: resolve teamId from Supabase auth
// ---------------------------------------------------------------------------

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
        // auth or query failure — checklist won't render
      }
    }

    resolve();
  }, []);

  return teamId;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface OnboardingChecklistProps {
  isExpanded: boolean;
}

export function OnboardingChecklist({ isExpanded }: OnboardingChecklistProps) {
  const teamId = useTeamId();
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Hydrate dismiss state from localStorage
  useEffect(() => {
    setDismissed(isDismissed());
    setMounted(true);
  }, []);

  // Fetch completion counts when teamId is available
  useEffect(() => {
    if (!teamId || dismissed) return;

    let cancelled = false;

    async function check() {
      try {
        const counts = await fetchCompletionCounts(teamId as string);
        if (!cancelled) {
          setCompleted(deriveCompleted(counts));
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    check();

    // Re-check every 30s so completing actions on other pages updates the list
    pollRef.current = setInterval(check, 30_000);

    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [teamId, dismissed]);

  // Also re-check when the window regains focus (user navigated back)
  useEffect(() => {
    if (!teamId || dismissed) return;

    function onFocus() {
      fetchCompletionCounts(teamId as string)
        .then((counts) => setCompleted(deriveCompleted(counts)))
        .catch(() => {
          // ignore
        });
    }

    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [teamId, dismissed]);

  const completedCount = completed.size;
  const totalCount = steps.length;

  const handleDismiss = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDismissed(true);
    persistDismiss();
  }, []);

  // Don't render until mounted (avoids hydration mismatch)
  if (!mounted) return null;

  // Don't render if dismissed or all steps completed
  if (dismissed || completedCount === totalCount) return null;

  // Don't render while we haven't resolved the teamId yet
  if (!teamId && loading) return null;

  // When sidebar is collapsed, show a small progress indicator
  if (!isExpanded) {
    return (
      <div className="w-full flex justify-center pb-2">
        <div className="relative w-[32px] h-[32px] flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 32 32">
            <circle
              cx="16"
              cy="16"
              r="13"
              fill="none"
              stroke="#e6e6e6"
              strokeWidth="2.5"
            />
            <circle
              cx="16"
              cy="16"
              r="13"
              fill="none"
              stroke="#666"
              strokeWidth="2.5"
              strokeDasharray={`${(completedCount / totalCount) * 81.68} 81.68`}
              strokeLinecap="round"
              transform="rotate(-90 16 16)"
            />
          </svg>
          <span className="absolute text-[9px] font-medium text-[#666]">
            {completedCount}/{totalCount}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-3 pb-2">
      <div className="border border-[#e6e6e6] bg-[#fafafa] rounded-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2">
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="flex items-center gap-1.5 text-xs font-medium text-[#666] hover:text-[#333] transition-colors py-1 min-h-[36px]"
          >
            {isCollapsed ? (
              <ChevronUp size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
            <span>Getting started</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#888]">
              {loading ? (
                <Loader2 size={10} className="animate-spin" />
              ) : (
                `${completedCount} of ${totalCount}`
              )}
            </span>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-[#aaa] hover:text-[#666] transition-colors p-1.5 min-h-[32px] min-w-[32px] flex items-center justify-center"
              title="Dismiss checklist"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-3 pb-2">
          <div className="h-[3px] bg-[#e6e6e6] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#666] rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Steps */}
        {!isCollapsed && (
          <div className="px-2 pb-2 flex flex-col gap-0.5">
            {steps.map((step) => {
              const done = completed.has(step.id);
              return (
                <Link
                  key={step.id}
                  href={step.href}
                  className="flex items-center gap-2 group/step rounded-md hover:bg-[#f0f0f0] transition-colors px-1"
                >
                  <div
                    className={cn(
                      "flex-shrink-0 transition-colors p-1 min-h-[36px] min-w-[36px] flex items-center justify-center",
                      done ? "text-[#666]" : "text-[#ccc]",
                    )}
                  >
                    {done ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <Circle size={16} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-1.5">
                    <span
                      className={cn(
                        "block text-[11px] leading-tight transition-colors truncate",
                        done
                          ? "text-[#aaa] line-through"
                          : "text-[#666] group-hover/step:text-[#333]",
                      )}
                    >
                      {step.label}
                    </span>
                    {!done && (
                      <span className="block text-[10px] text-[#aaa] leading-tight mt-0.5 truncate">
                        {step.description}
                      </span>
                    )}
                  </div>
                  {!done && (
                    <ArrowRight
                      size={14}
                      className="flex-shrink-0 text-[#ccc] opacity-0 -translate-x-2 group-hover/step:opacity-100 group-hover/step:translate-x-0 transition-all duration-200"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
