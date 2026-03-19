"use client";

import { cn } from "@vendcfo/ui/cn";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "vendcfo-onboarding";

interface OnboardingState {
  completed: string[];
  dismissed: boolean;
}

const steps = [
  {
    id: "import-data",
    label: "Import your financial data",
    href: "/import",
  },
  {
    id: "add-location",
    label: "Add your first location",
    href: "/locations",
  },
  {
    id: "add-machine",
    label: "Add a vending machine",
    href: "/machines",
  },
  {
    id: "set-up-route",
    label: "Set up a route",
    href: "/routes",
  },
  {
    id: "create-invoice",
    label: "Create your first invoice",
    href: "/invoices",
  },
] as const;

function loadState(): OnboardingState {
  if (typeof window === "undefined") {
    return { completed: [], dismissed: false };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as OnboardingState;
    }
  } catch {
    // ignore parse errors
  }
  return { completed: [], dismissed: false };
}

function saveState(state: OnboardingState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

interface OnboardingChecklistProps {
  isExpanded: boolean;
}

export function OnboardingChecklist({ isExpanded }: OnboardingChecklistProps) {
  const [state, setState] = useState<OnboardingState>({
    completed: [],
    dismissed: false,
  });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setState(loadState());
    setMounted(true);
  }, []);

  const completedCount = state.completed.length;
  const totalCount = steps.length;

  const toggleStep = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const isCompleted = state.completed.includes(id);
      const next: OnboardingState = {
        ...state,
        completed: isCompleted
          ? state.completed.filter((s) => s !== id)
          : [...state.completed, id],
      };
      setState(next);
      saveState(next);
    },
    [state],
  );

  const dismiss = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const next: OnboardingState = { ...state, dismissed: true };
      setState(next);
      saveState(next);
    },
    [state],
  );

  // Don't render until mounted (avoids hydration mismatch with localStorage)
  if (!mounted) return null;

  // Don't render if dismissed or all steps completed
  if (state.dismissed || completedCount === totalCount) return null;

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
            onClick={() => setIsCollapsed(!isCollapsed)}
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
              {completedCount} of {totalCount}
            </span>
            <button
              type="button"
              onClick={dismiss}
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
                width: `${(completedCount / totalCount) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Steps */}
        {!isCollapsed && (
          <div className="px-2 pb-2 flex flex-col gap-0.5">
            {steps.map((step) => {
              const done = state.completed.includes(step.id);
              return (
                <div
                  key={step.id}
                  className="flex items-center gap-2 group/step"
                >
                  <button
                    type="button"
                    onClick={(e) => toggleStep(step.id, e)}
                    className={cn(
                      "flex-shrink-0 transition-colors p-1 min-h-[36px] min-w-[36px] flex items-center justify-center",
                      done
                        ? "text-[#666]"
                        : "text-[#ccc] hover:text-[#888]",
                    )}
                  >
                    {done ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <Circle size={16} />
                    )}
                  </button>
                  <Link
                    href={step.href}
                    className={cn(
                      "text-[11px] leading-tight py-2 transition-colors truncate min-h-[36px] flex items-center",
                      done
                        ? "text-[#aaa] line-through"
                        : "text-[#666] hover:text-[#333] group-hover/step:text-[#333]",
                    )}
                  >
                    {step.label}
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
