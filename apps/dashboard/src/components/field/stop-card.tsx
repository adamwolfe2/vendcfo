"use client";

import { cn } from "@vendcfo/ui/cn";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  Play,
  SkipForward,
} from "lucide-react";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StopStatus = "upcoming" | "in-progress" | "completed" | "skipped";

export interface StopData {
  id: string;
  locationId: string;
  locationName: string;
  address: string | null;
  action: string;
  stockHours: number;
  pickHours: number;
  status: StopStatus;
  startedAt: string | null;
  completedAt: string | null;
  skipNote: string | null;
  machines: Array<{
    id: string;
    serialNumber: string | null;
    makeModel: string | null;
    machineType: string | null;
  }>;
}

interface StopCardProps {
  stop: StopData;
  index: number;
  onStart: (stopId: string) => void;
  onComplete: (stopId: string) => void;
  onSkip: (stopId: string, note: string) => void;
  onReportIssue: (stopId: string, note: string) => void;
  isLoading: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  StopStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  upcoming: {
    label: "Upcoming",
    bg: "bg-[#f5f5f5]",
    text: "text-[#666]",
    border: "border-[#e0e0e0]",
  },
  "in-progress": {
    label: "In Progress",
    bg: "bg-[#fef9c3]",
    text: "text-[#854d0e]",
    border: "border-[#fbbf24]",
  },
  completed: {
    label: "Completed",
    bg: "bg-[#dcfce7]",
    text: "text-[#166534]",
    border: "border-[#22c55e]",
  },
  skipped: {
    label: "Skipped",
    bg: "bg-[#fee2e2]",
    text: "text-[#991b1b]",
    border: "border-[#ef4444]",
  },
};

function formatAction(action: string): string {
  switch (action) {
    case "pick":
      return "Pick";
    case "stock":
      return "Stock";
    case "pick_stock":
      return "Pick & Stock";
    default:
      return action;
  }
}

function formatDuration(hours: number): string {
  if (hours === 0) return "-";
  if (hours < 1) return `${Math.round(hours * 60)}min`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StopCard({
  stop,
  index,
  onStart,
  onComplete,
  onSkip,
  onReportIssue,
  isLoading,
}: StopCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSkipInput, setShowSkipInput] = useState(false);
  const [showIssueInput, setShowIssueInput] = useState(false);
  const [skipNote, setSkipNote] = useState("");
  const [issueNote, setIssueNote] = useState("");

  const config = STATUS_CONFIG[stop.status];
  const totalHours = stop.stockHours + stop.pickHours;
  const isDone = stop.status === "completed" || stop.status === "skipped";

  const handleSkip = () => {
    onSkip(stop.id, skipNote);
    setSkipNote("");
    setShowSkipInput(false);
  };

  const handleReportIssue = () => {
    onReportIssue(stop.id, issueNote);
    setIssueNote("");
    setShowIssueInput(false);
  };

  return (
    <div
      className={cn(
        "border rounded-lg overflow-hidden transition-all duration-200",
        config.border,
        isDone && "opacity-75",
      )}
    >
      {/* Main card content - tappable to expand */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-4 focus:outline-none active:bg-[#fafafa]"
      >
        <div className="flex items-start gap-3">
          {/* Stop number indicator */}
          <div
            className={cn(
              "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
              stop.status === "completed" && "bg-[#22c55e] text-white",
              stop.status === "in-progress" && "bg-[#fbbf24] text-[#854d0e]",
              stop.status === "skipped" && "bg-[#ef4444] text-white",
              stop.status === "upcoming" && "bg-[#e5e5e5] text-[#666]",
            )}
          >
            {stop.status === "completed" ? (
              <Check size={16} strokeWidth={2.5} />
            ) : (
              index + 1
            )}
          </div>

          {/* Stop details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-[#1a1a1a] truncate">
                {stop.locationName}
              </h3>
              <span
                className={cn(
                  "flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full",
                  config.bg,
                  config.text,
                )}
              >
                {config.label}
              </span>
            </div>

            {stop.address && (
              <div className="flex items-center gap-1 mt-1">
                <MapPin size={13} className="text-[#999] flex-shrink-0" />
                <span className="text-sm text-[#666] truncate">
                  {stop.address}
                </span>
              </div>
            )}

            <div className="flex items-center gap-3 mt-2">
              <span className="inline-block rounded px-2 py-0.5 text-xs font-medium bg-[#f0f0f0] text-[#444]">
                {formatAction(stop.action)}
              </span>
              {totalHours > 0 && (
                <span className="flex items-center gap-1 text-xs text-[#888]">
                  <Clock size={12} />
                  {formatDuration(totalHours)}
                </span>
              )}
              {stop.startedAt && (
                <span className="text-xs text-[#888]">
                  Started {formatTime(stop.startedAt)}
                </span>
              )}
              {stop.completedAt && (
                <span className="text-xs text-[#888]">
                  Done {formatTime(stop.completedAt)}
                </span>
              )}
            </div>
          </div>

          {/* Expand chevron */}
          <div className="flex-shrink-0 text-[#999] mt-1">
            {isExpanded ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </div>
        </div>
      </button>

      {/* Expanded section */}
      {isExpanded && (
        <div className="border-t border-[#eee] px-4 pb-4">
          {/* Machine details */}
          {stop.machines.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-[#999] uppercase tracking-wide mb-2">
                Machines at this location
              </p>
              <div className="space-y-2">
                {stop.machines.map((machine) => (
                  <div
                    key={machine.id}
                    className="flex items-center gap-2 text-sm bg-[#fafafa] rounded px-3 py-2"
                  >
                    <div className="w-2 h-2 rounded-full bg-[#22c55e] flex-shrink-0" />
                    <span className="text-[#333]">
                      {machine.makeModel || machine.machineType || "Machine"}
                    </span>
                    {machine.serialNumber && (
                      <span className="text-[#999] text-xs ml-auto">
                        SN: {machine.serialNumber}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Time breakdown */}
          {(stop.stockHours > 0 || stop.pickHours > 0) && (
            <div className="mt-3 flex gap-4">
              {stop.stockHours > 0 && (
                <div className="text-sm">
                  <span className="text-[#999]">Stock:</span>{" "}
                  <span className="font-medium">
                    {formatDuration(stop.stockHours)}
                  </span>
                </div>
              )}
              {stop.pickHours > 0 && (
                <div className="text-sm">
                  <span className="text-[#999]">Pick:</span>{" "}
                  <span className="font-medium">
                    {formatDuration(stop.pickHours)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          {!isDone && (
            <div className="mt-4 flex flex-wrap gap-2">
              {stop.status === "upcoming" && (
                <button
                  type="button"
                  onClick={() => onStart(stop.id)}
                  disabled={isLoading}
                  className={cn(
                    "flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold",
                    "bg-[#1a1a1a] text-white active:bg-[#333]",
                    "min-h-[48px] min-w-[120px] justify-center",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "transition-colors",
                  )}
                >
                  <Play size={16} />
                  Start
                </button>
              )}

              {stop.status === "in-progress" && (
                <button
                  type="button"
                  onClick={() => onComplete(stop.id)}
                  disabled={isLoading}
                  className={cn(
                    "flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold",
                    "bg-[#22c55e] text-white active:bg-[#16a34a]",
                    "min-h-[48px] min-w-[120px] justify-center",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "transition-colors",
                  )}
                >
                  <Check size={16} />
                  Complete
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowSkipInput(!showSkipInput);
                  setShowIssueInput(false);
                }}
                disabled={isLoading}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium",
                  "bg-[#f5f5f5] text-[#666] active:bg-[#eee] border border-[#ddd]",
                  "min-h-[48px] justify-center",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-colors",
                )}
              >
                <SkipForward size={16} />
                Skip
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowIssueInput(!showIssueInput);
                  setShowSkipInput(false);
                }}
                disabled={isLoading}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium",
                  "bg-[#f5f5f5] text-[#666] active:bg-[#eee] border border-[#ddd]",
                  "min-h-[48px] justify-center",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-colors",
                )}
              >
                <AlertTriangle size={16} />
                Issue
              </button>
            </div>
          )}

          {/* Skip note input */}
          {showSkipInput && (
            <div className="mt-3 space-y-2">
              <textarea
                placeholder="Reason for skipping (optional)"
                value={skipNote}
                onChange={(e) => setSkipNote(e.target.value)}
                className="w-full border border-[#ddd] rounded-lg p-3 text-sm min-h-[80px] focus:outline-none focus:border-[#999] resize-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={isLoading}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium bg-[#ef4444] text-white active:bg-[#dc2626] min-h-[44px] disabled:opacity-50 transition-colors"
                >
                  Confirm Skip
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSkipInput(false);
                    setSkipNote("");
                  }}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium bg-[#f5f5f5] text-[#666] active:bg-[#eee] border border-[#ddd] min-h-[44px] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Issue report input */}
          {showIssueInput && (
            <div className="mt-3 space-y-2">
              <textarea
                placeholder="Describe the issue..."
                value={issueNote}
                onChange={(e) => setIssueNote(e.target.value)}
                className="w-full border border-[#ddd] rounded-lg p-3 text-sm min-h-[80px] focus:outline-none focus:border-[#999] resize-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleReportIssue}
                  disabled={isLoading || !issueNote.trim()}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium bg-[#f59e0b] text-white active:bg-[#d97706] min-h-[44px] disabled:opacity-50 transition-colors"
                >
                  Submit Issue
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowIssueInput(false);
                    setIssueNote("");
                  }}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium bg-[#f5f5f5] text-[#666] active:bg-[#eee] border border-[#ddd] min-h-[44px] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Skip note display for already-skipped */}
          {stop.status === "skipped" && stop.skipNote && (
            <div className="mt-3 bg-[#fee2e2] rounded-lg p-3">
              <p className="text-xs font-medium text-[#991b1b] mb-1">
                Skip reason:
              </p>
              <p className="text-sm text-[#7f1d1d]">{stop.skipNote}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
