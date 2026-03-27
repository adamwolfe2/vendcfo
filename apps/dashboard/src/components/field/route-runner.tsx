"use client";

import { createClient } from "@vendcfo/supabase/client";
import { cn } from "@vendcfo/ui/cn";
import { Progress } from "@vendcfo/ui/progress";
import {
  ArrowLeft,
  ChevronDown,
  RefreshCw,
  Smartphone,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useReducer, useState } from "react";
import { StopCard, type StopData, type StopStatus } from "./stop-card";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RouteRow {
  id: string;
  name: string;
  description: string | null;
  operator_id: string | null;
}

interface LocationRow {
  id: string;
  name: string;
  address: string | null;
  route_id: string | null;
  stock_hours: string | number | null;
  pick_hours: string | number | null;
}

interface ScheduleRow {
  id: string;
  location_id: string;
  day_of_week: number;
  action: string;
}

interface MachineRow {
  id: string;
  location_id: string;
  serial_number: string | null;
  make_model: string | null;
  machine_type: string | null;
}

interface RouteRunnerProps {
  routes: RouteRow[];
  locations: LocationRow[];
  schedules: ScheduleRow[];
  machines: MachineRow[];
  teamId: string;
  userName: string;
  todayDayOfWeek: number;
}

// ---------------------------------------------------------------------------
// Reducer for stop state management (immutable)
// ---------------------------------------------------------------------------

type StopAction =
  | { type: "START"; stopId: string; timestamp: string }
  | { type: "COMPLETE"; stopId: string; timestamp: string }
  | { type: "SKIP"; stopId: string; note: string; timestamp: string }
  | { type: "REPORT_ISSUE"; stopId: string; note: string }
  | { type: "SET_ALL"; stops: StopData[] };

function stopsReducer(state: StopData[], action: StopAction): StopData[] {
  switch (action.type) {
    case "START":
      return state.map((s) =>
        s.id === action.stopId
          ? { ...s, status: "in-progress" as StopStatus, startedAt: action.timestamp }
          : s,
      );
    case "COMPLETE":
      return state.map((s) =>
        s.id === action.stopId
          ? { ...s, status: "completed" as StopStatus, completedAt: action.timestamp }
          : s,
      );
    case "SKIP":
      return state.map((s) =>
        s.id === action.stopId
          ? { ...s, status: "skipped" as StopStatus, skipNote: action.note, completedAt: action.timestamp }
          : s,
      );
    case "REPORT_ISSUE":
      // Issue is logged but stop status doesn't change
      return state;
    case "SET_ALL":
      return action.stops;
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toNum(val: string | number | null | undefined): number {
  if (val === null || val === undefined) return 0;
  const n = typeof val === "string" ? Number.parseFloat(val) : val;
  return Number.isNaN(n) ? 0 : n;
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RouteRunner({
  routes,
  locations,
  schedules,
  machines,
  teamId,
  userName,
  todayDayOfWeek,
}: RouteRunnerProps) {
  const [selectedRouteId, setSelectedRouteId] = useState<string>(
    routes[0]?.id ?? "",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRouteSelect, setShowRouteSelect] = useState(false);

  // Build stops from schedule + locations + machines
  const initialStops = useMemo((): StopData[] => {
    const todaySchedules = schedules.filter(
      (s) => s.day_of_week === todayDayOfWeek && s.action !== "nothing",
    );

    const routeLocations = locations.filter(
      (loc) => loc.route_id === selectedRouteId,
    );

    const stops: StopData[] = [];

    for (const loc of routeLocations) {
      const schedule = todaySchedules.find((s) => s.location_id === loc.id);
      if (!schedule) continue;

      const locationMachines = machines.filter(
        (m) => m.location_id === loc.id,
      );

      stops.push({
        id: `${loc.id}-${schedule.id}`,
        locationId: loc.id,
        locationName: loc.name,
        address: loc.address,
        action: schedule.action,
        stockHours: toNum(loc.stock_hours),
        pickHours: toNum(loc.pick_hours),
        status: "upcoming",
        startedAt: null,
        completedAt: null,
        skipNote: null,
        machines: locationMachines.map((m) => ({
          id: m.id,
          serialNumber: m.serial_number,
          makeModel: m.make_model,
          machineType: m.machine_type,
        })),
      });
    }

    return stops;
  }, [schedules, locations, machines, selectedRouteId, todayDayOfWeek]);

  const [stops, dispatch] = useReducer(stopsReducer, initialStops);

  // Recalculate when route changes — use a key-based reset approach
  const selectedRoute = routes.find((r) => r.id === selectedRouteId);

  const completedCount = stops.filter(
    (s) => s.status === "completed" || s.status === "skipped",
  ).length;
  const totalCount = stops.length;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Persist stop status to service_logs
  const persistToServiceLogs = useCallback(
    async (
      locationId: string,
      status: "started" | "completed" | "skipped",
      notes?: string,
    ) => {
      try {
        const supabase = createClient();
        const locationMachines = machines.filter(
          (m) => m.location_id === locationId,
        );
        const machineId = locationMachines[0]?.id;

        if (!machineId) return;

        await (supabase as any).from("service_logs").insert({
          business_id: teamId,
          machine_id: machineId,
          user_id: teamId, // Will be replaced by actual user ID from auth
          service_date: new Date().toISOString(),
          notes: notes || `Stop ${status}`,
        });
      } catch {
        // Non-critical — optimistic UI is already updated
      }
    },
    [machines, teamId],
  );

  const handleStart = useCallback(
    (stopId: string) => {
      setIsLoading(true);
      const timestamp = new Date().toISOString();
      dispatch({ type: "START", stopId, timestamp });

      const stop = stops.find((s) => s.id === stopId);
      if (stop) {
        persistToServiceLogs(stop.locationId, "started");
      }
      setIsLoading(false);
    },
    [stops, persistToServiceLogs],
  );

  const handleComplete = useCallback(
    (stopId: string) => {
      setIsLoading(true);
      const timestamp = new Date().toISOString();
      dispatch({ type: "COMPLETE", stopId, timestamp });

      const stop = stops.find((s) => s.id === stopId);
      if (stop) {
        persistToServiceLogs(stop.locationId, "completed");
      }
      setIsLoading(false);
    },
    [stops, persistToServiceLogs],
  );

  const handleSkip = useCallback(
    (stopId: string, note: string) => {
      setIsLoading(true);
      const timestamp = new Date().toISOString();
      dispatch({ type: "SKIP", stopId, note, timestamp });

      const stop = stops.find((s) => s.id === stopId);
      if (stop) {
        persistToServiceLogs(
          stop.locationId,
          "skipped",
          note || "Stop skipped",
        );
      }
      setIsLoading(false);
    },
    [stops, persistToServiceLogs],
  );

  const handleReportIssue = useCallback(
    (stopId: string, note: string) => {
      setIsLoading(true);
      dispatch({ type: "REPORT_ISSUE", stopId, note });

      const stop = stops.find((s) => s.id === stopId);
      if (stop) {
        persistToServiceLogs(stop.locationId, "started", `ISSUE: ${note}`);
      }
      setIsLoading(false);
    },
    [stops, persistToServiceLogs],
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // Re-derive stops from the same data (in a full implementation,
    // this would re-fetch from Supabase)
    dispatch({ type: "SET_ALL", stops: initialStops });
    // Simulate network delay for visual feedback
    await new Promise((resolve) => setTimeout(resolve, 300));
    setIsRefreshing(false);
  }, [initialStops]);

  const handleRouteChange = useCallback(
    (routeId: string) => {
      setSelectedRouteId(routeId);
      setShowRouteSelect(false);
      // Stops will re-derive via useMemo + reducer reset on next render
      // We need to reset the reducer state for the new route
      const newSchedules = schedules.filter(
        (s) => s.day_of_week === todayDayOfWeek && s.action !== "nothing",
      );
      const routeLocations = locations.filter(
        (loc) => loc.route_id === routeId,
      );
      const newStops: StopData[] = [];

      for (const loc of routeLocations) {
        const schedule = newSchedules.find((s) => s.location_id === loc.id);
        if (!schedule) continue;

        const locationMachines = machines.filter(
          (m) => m.location_id === loc.id,
        );

        newStops.push({
          id: `${loc.id}-${schedule.id}`,
          locationId: loc.id,
          locationName: loc.name,
          address: loc.address,
          action: schedule.action,
          stockHours: toNum(loc.stock_hours),
          pickHours: toNum(loc.pick_hours),
          status: "upcoming",
          startedAt: null,
          completedAt: null,
          skipNote: null,
          machines: locationMachines.map((m) => ({
            id: m.id,
            serialNumber: m.serial_number,
            makeModel: m.make_model,
            machineType: m.machine_type,
          })),
        });
      }

      dispatch({ type: "SET_ALL", stops: newStops });
    },
    [schedules, locations, machines, todayDayOfWeek],
  );

  // ---------------------------------------------------------------------------
  // Empty state
  // ---------------------------------------------------------------------------

  if (routes.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <MobileHeader />
        <div className="px-4 py-16 text-center">
          <Smartphone size={48} className="mx-auto text-[#ccc] mb-4" />
          <h2 className="text-lg font-semibold text-[#333] mb-2">
            No Routes Found
          </h2>
          <p className="text-sm text-[#888] mb-6">
            Routes need to be set up before you can use Field View. Head to
            Operations to create routes and assign locations.
          </p>
          <Link
            href="/routes"
            className="inline-block px-6 py-3 bg-[#1a1a1a] text-white rounded-lg text-sm font-medium active:bg-[#333] transition-colors"
          >
            Go to Routes
          </Link>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-white -mx-4 md:-mx-8">
      {/* Mobile header */}
      <MobileHeader />

      {/* Route info header */}
      <div className="px-4 pt-4 pb-3 border-b border-[#eee]">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-[#999] uppercase tracking-wide font-medium">
            {formatDate()}
          </p>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 -mr-2 text-[#999] active:text-[#333] transition-colors"
            aria-label="Refresh"
          >
            <RefreshCw
              size={18}
              className={cn(isRefreshing && "animate-spin")}
            />
          </button>
        </div>

        {/* Route selector */}
        {routes.length > 1 ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowRouteSelect(!showRouteSelect)}
              className="flex items-center gap-2 text-left"
            >
              <h1 className="text-xl font-bold text-[#1a1a1a]">
                {selectedRoute?.name || "Select Route"}
              </h1>
              <ChevronDown
                size={18}
                className={cn(
                  "text-[#999] transition-transform",
                  showRouteSelect && "rotate-180",
                )}
              />
            </button>

            {showRouteSelect && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#ddd] rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
                {routes.map((route) => (
                  <button
                    key={route.id}
                    type="button"
                    onClick={() => handleRouteChange(route.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 text-sm border-b border-[#f0f0f0] last:border-b-0",
                      "active:bg-[#f5f5f5] transition-colors",
                      route.id === selectedRouteId &&
                        "bg-[#f5f5f5] font-semibold",
                    )}
                  >
                    {route.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <h1 className="text-xl font-bold text-[#1a1a1a]">
            {selectedRoute?.name || "Route"}
          </h1>
        )}

        <p className="text-sm text-[#666] mt-0.5">{userName}</p>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-[#333]">
              {completedCount} of {totalCount} stops completed
            </span>
            <span className="text-sm font-semibold text-[#333]">
              {Math.round(progressPct)}%
            </span>
          </div>
          <Progress
            value={progressPct}
            className="h-3 rounded-full bg-[#e5e5e5]"
          />
        </div>
      </div>

      {/* Stop cards */}
      <div className="px-4 py-4 space-y-3">
        {stops.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-base font-medium text-[#666] mb-1">
              No stops scheduled today
            </p>
            <p className="text-sm text-[#999]">
              Check the Logistics page to update service schedules.
            </p>
          </div>
        ) : (
          stops.map((stop, index) => (
            <StopCard
              key={stop.id}
              stop={stop}
              index={index}
              onStart={handleStart}
              onComplete={handleComplete}
              onSkip={handleSkip}
              onReportIssue={handleReportIssue}
              isLoading={isLoading}
            />
          ))
        )}
      </div>

      {/* Bottom safe area for mobile */}
      <div className="h-8" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile Header (minimal top nav instead of sidebar)
// ---------------------------------------------------------------------------

function MobileHeader() {
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-[#eee]">
      <div className="flex items-center justify-between px-4 h-14">
        <Link
          href="/"
          className="flex items-center gap-2 text-[#666] active:text-[#333] transition-colors min-h-[48px]"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Dashboard</span>
        </Link>
        <div className="flex items-center gap-1">
          <Smartphone size={18} className="text-[#999]" />
          <span className="text-sm font-semibold text-[#333]">Field View</span>
        </div>
      </div>
    </div>
  );
}
