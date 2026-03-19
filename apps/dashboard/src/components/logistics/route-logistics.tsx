"use client";

import { createClient } from "@vendcfo/supabase/client";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Check,
  Loader2,
  MapPin,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Location {
  id: string;
  name: string;
  address: string;
  route_id: string | null;
  is_active: boolean;
}

interface Route {
  id: string;
  name: string;
}

interface ScheduleEntry {
  id?: string;
  team_id: string;
  location_id: string;
  day_of_week: number;
  action: string;
  estimated_hours: number;
}

type ActionType = "nothing" | "pick_stock" | "pickup_only" | "delivery";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAYS = [
  { key: 1, label: "Monday" },
  { key: 2, label: "Tuesday" },
  { key: 3, label: "Wednesday" },
  { key: 4, label: "Thursday" },
  { key: 5, label: "Friday" },
  { key: 6, label: "Saturday" },
] as const;

const ACTION_CYCLE: ActionType[] = [
  "nothing",
  "pick_stock",
  "pickup_only",
  "delivery",
];

const ACTION_CONFIG: Record<
  ActionType,
  { label: string; bg: string; text: string }
> = {
  nothing: { label: "Nothing", bg: "#f5f5f5", text: "#999" },
  pick_stock: { label: "Pick/Stock", bg: "#dcfce7", text: "#22c55e" },
  pickup_only: { label: "Pickup Only", bg: "#dbeafe", text: "#3b82f6" },
  delivery: { label: "Delivery", bg: "#fef9c3", text: "#a16207" },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeKey(locationId: string, dayOfWeek: number) {
  return `${locationId}-${dayOfWeek}`;
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function SaveIndicator({ status }: { status: "idle" | "saving" | "saved" }) {
  if (status === "idle") return null;

  return (
    <div className="flex items-center gap-1.5 text-xs font-medium">
      {status === "saving" ? (
        <>
          <Loader2 size={14} strokeWidth={1.5} className="animate-spin text-[#888]" />
          <span className="text-[#888]">Saving...</span>
        </>
      ) : (
        <>
          <Check size={14} strokeWidth={1.5} className="text-[#22c55e]" />
          <span className="text-[#22c55e]">Saved</span>
        </>
      )}
    </div>
  );
}

function ActionCell({
  action,
  onClick,
}: {
  action: ActionType;
  onClick: () => void;
}) {
  const config = ACTION_CONFIG[action];

  return (
    <td
      className="border border-[#e5e5e5] text-center cursor-pointer select-none transition-colors hover:opacity-80"
      style={{
        backgroundColor: config.bg,
        minWidth: 100,
      }}
      onClick={onClick}
    >
      <span
        className="text-xs font-medium"
        style={{ color: config.text }}
      >
        {config.label}
      </span>
    </td>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#d0d0d0] bg-[#fafafa] py-20 px-6 text-center">
      <MapPin size={40} strokeWidth={1.5} className="mb-4 text-[#bbb]" />
      <p className="text-sm font-medium text-[#555]">
        No locations set up yet.
      </p>
      <p className="mt-1 text-xs text-[#999]">
        Add locations in Operations &gt; Locations to start scheduling.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function RouteLogistics({
  locations,
  routes,
  teamId,
}: {
  locations: Location[];
  routes: Route[];
  teamId: string;
}) {
  const supabase = createClient();

  // Schedule state: Map<"locationId-dayOfWeek", ScheduleEntry>
  const [schedule, setSchedule] = useState<Map<string, ScheduleEntry>>(
    new Map(),
  );
  const [collapsedRoutes, setCollapsedRoutes] = useState<Set<string>>(
    new Set(),
  );
  const [hourlyRate, setHourlyRate] = useState(25);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [loading, setLoading] = useState(true);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Group locations by route
  const routeMap = new Map<string, Route>();
  for (const r of routes) {
    routeMap.set(r.id, r);
  }

  const locationsByRoute = new Map<string, Location[]>();
  const unassigned: Location[] = [];

  for (const loc of locations) {
    if (loc.route_id && routeMap.has(loc.route_id)) {
      const existing = locationsByRoute.get(loc.route_id) ?? [];
      existing.push(loc);
      locationsByRoute.set(loc.route_id, existing);
    } else {
      unassigned.push(loc);
    }
  }

  // Fetch schedules on mount
  useEffect(() => {
    async function fetchSchedules() {
      const { data } = await supabase
        .from("route_schedules")
        .select("*")
        .eq("team_id", teamId);

      if (data) {
        const map = new Map<string, ScheduleEntry>();
        for (const entry of data) {
          map.set(makeKey(entry.location_id, entry.day_of_week), {
            id: entry.id,
            team_id: entry.team_id,
            location_id: entry.location_id,
            day_of_week: entry.day_of_week,
            action: entry.action,
            estimated_hours: Number(entry.estimated_hours),
          });
        }
        setSchedule(map);
      }
      setLoading(false);
    }

    fetchSchedules();
  }, [teamId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save with debounce
  const saveEntry = useCallback(
    (entry: ScheduleEntry) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (savedTimer.current) clearTimeout(savedTimer.current);

      setSaveStatus("saving");

      debounceTimer.current = setTimeout(async () => {
        await supabase.from("route_schedules").upsert(
          {
            team_id: entry.team_id,
            location_id: entry.location_id,
            day_of_week: entry.day_of_week,
            action: entry.action,
            estimated_hours: entry.estimated_hours,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "team_id,location_id,day_of_week" },
        );

        setSaveStatus("saved");
        savedTimer.current = setTimeout(() => setSaveStatus("idle"), 2000);
      }, 500);
    },
    [supabase],
  );

  const handleCellClick = (locationId: string, dayOfWeek: number) => {
    const key = makeKey(locationId, dayOfWeek);
    const current = schedule.get(key);
    const currentAction = (current?.action ?? "nothing") as ActionType;
    const currentIdx = ACTION_CYCLE.indexOf(currentAction);
    const nextAction = ACTION_CYCLE[(currentIdx + 1) % ACTION_CYCLE.length];

    const entry: ScheduleEntry = {
      team_id: teamId,
      location_id: locationId,
      day_of_week: dayOfWeek,
      action: nextAction,
      estimated_hours: current?.estimated_hours ?? 0.5,
    };

    setSchedule((prev) => {
      const next = new Map(prev);
      next.set(key, entry);
      return next;
    });

    saveEntry(entry);
  };

  const handleHoursChange = (locationId: string, hours: number) => {
    // Update all day entries for this location
    setSchedule((prev) => {
      const next = new Map(prev);
      for (const day of DAYS) {
        const key = makeKey(locationId, day.key);
        const existing = next.get(key);
        if (existing) {
          const updated = { ...existing, estimated_hours: hours };
          next.set(key, updated);
          saveEntry(updated);
        }
      }
      return next;
    });
  };

  const toggleRoute = (routeId: string) => {
    setCollapsedRoutes((prev) => {
      const next = new Set(prev);
      if (next.has(routeId)) {
        next.delete(routeId);
      } else {
        next.add(routeId);
      }
      return next;
    });
  };

  const getAction = (locationId: string, dayOfWeek: number): ActionType => {
    const key = makeKey(locationId, dayOfWeek);
    return (schedule.get(key)?.action ?? "nothing") as ActionType;
  };

  const getHours = (locationId: string): number => {
    // Find any entry for this location to get hours, default 0.5
    for (const day of DAYS) {
      const key = makeKey(locationId, day.key);
      const entry = schedule.get(key);
      if (entry) return entry.estimated_hours;
    }
    return 0.5;
  };

  // Summary calculations
  const summaryByDay = DAYS.map((day) => {
    let stops = 0;
    let hours = 0;
    for (const loc of locations) {
      const action = getAction(loc.id, day.key);
      if (action !== "nothing") {
        stops++;
        hours += getHours(loc.id);
      }
    }
    return { day: day.label, stops, hours };
  });

  const totalStops = summaryByDay.reduce((sum, d) => sum + d.stops, 0);
  const totalHours = summaryByDay.reduce((sum, d) => sum + d.hours, 0);
  const totalCost = totalHours * hourlyRate;

  if (locations.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Route Logistics
          </h1>
          <p className="text-muted-foreground">
            Weekly schedule grid for vending machine route operations.
          </p>
        </div>
        <EmptyState />
      </div>
    );
  }

  const renderLocationRow = (loc: Location) => {
    const hours = getHours(loc.id);

    return (
      <tr key={loc.id} className="hover:bg-[#fafafa]">
        <td className="border border-[#e5e5e5] px-3 py-2 sticky left-0 bg-white z-10">
          <div className="font-medium text-sm text-[#111]">{loc.name}</div>
        </td>
        <td className="border border-[#e5e5e5] px-3 py-2">
          <div className="text-xs text-[#878787] truncate max-w-[180px]">
            {loc.address}
          </div>
        </td>
        <td className="border border-[#e5e5e5] px-2 py-1 text-center">
          <input
            type="number"
            min={0.25}
            max={12}
            step={0.25}
            value={hours}
            onChange={(e) =>
              handleHoursChange(loc.id, Number.parseFloat(e.target.value) || 0.5)
            }
            className="w-14 text-center text-xs border border-[#d0d0d0] rounded px-1 py-1 bg-white outline-none focus:border-[#888]"
          />
        </td>
        {DAYS.map((day) => (
          <ActionCell
            key={day.key}
            action={getAction(loc.id, day.key)}
            onClick={() => handleCellClick(loc.id, day.key)}
          />
        ))}
      </tr>
    );
  };

  const renderRouteSection = (routeId: string, routeName: string, locs: Location[]) => {
    const isCollapsed = collapsedRoutes.has(routeId);

    return (
      <tbody key={routeId}>
        <tr>
          <td
            colSpan={9}
            className="bg-[#f0f0f0] border border-[#e5e5e5] px-3 py-2 cursor-pointer select-none"
            onClick={() => toggleRoute(routeId)}
          >
            <div className="flex items-center gap-2">
              {isCollapsed ? (
                <ChevronRight size={16} strokeWidth={1.5} className="text-[#666]" />
              ) : (
                <ChevronDown size={16} strokeWidth={1.5} className="text-[#666]" />
              )}
              <span className="font-semibold text-sm text-[#333]">
                {routeName}
              </span>
              <span className="text-xs text-[#888] ml-1">
                ({locs.length} location{locs.length !== 1 ? "s" : ""})
              </span>
            </div>
          </td>
        </tr>
        {!isCollapsed && locs.map(renderLocationRow)}
      </tbody>
    );
  };

  return (
    <div className="p-8 max-w-full mx-auto w-full">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Route Logistics
          </h1>
          <p className="text-muted-foreground">
            Weekly schedule grid for vending machine route operations.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <SaveIndicator status={saveStatus} />
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-[#555]">
              Hourly Rate
            </label>
            <div className="flex items-center">
              <span className="text-xs text-[#888] mr-1">$</span>
              <input
                type="number"
                min={0}
                step={1}
                value={hourlyRate}
                onChange={(e) =>
                  setHourlyRate(Number.parseInt(e.target.value, 10) || 0)
                }
                className="w-16 text-center text-xs border border-[#d0d0d0] rounded px-1 py-1 bg-white outline-none focus:border-[#888]"
              />
              <span className="text-xs text-[#888] ml-1">/hr</span>
            </div>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} strokeWidth={1.5} className="animate-spin text-[#888]" />
          <span className="ml-2 text-sm text-[#888]">Loading schedule...</span>
        </div>
      ) : (
        <>
          {/* Schedule Grid */}
          <div className="overflow-x-auto border border-[#e5e5e5] rounded-lg">
            <table
              className="w-full"
              style={{ borderCollapse: "collapse" }}
            >
              <thead>
                <tr className="bg-[#f9fafb]">
                  <th className="border border-[#e5e5e5] px-3 py-2.5 text-left text-sm font-medium text-[#555] sticky left-0 bg-[#f9fafb] z-10 min-w-[180px]">
                    Location
                  </th>
                  <th className="border border-[#e5e5e5] px-3 py-2.5 text-left text-sm font-medium text-[#555] min-w-[160px]">
                    Address
                  </th>
                  <th className="border border-[#e5e5e5] px-2 py-2.5 text-center text-sm font-medium text-[#555] min-w-[80px]">
                    Est. Hours
                  </th>
                  {DAYS.map((day) => (
                    <th
                      key={day.key}
                      className="border border-[#e5e5e5] px-3 py-2.5 text-center text-sm font-medium text-[#555]"
                      style={{ minWidth: 100 }}
                    >
                      {day.label}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Render route groups */}
              {Array.from(locationsByRoute.entries()).map(([routeId, locs]) => {
                const route = routeMap.get(routeId);
                return renderRouteSection(
                  routeId,
                  route?.name ?? "Unknown Route",
                  locs,
                );
              })}

              {/* Unassigned locations */}
              {unassigned.length > 0 &&
                renderRouteSection("unassigned", "Unassigned", unassigned)}
            </table>
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-4">
            <span className="text-xs font-medium text-[#555]">Legend:</span>
            {ACTION_CYCLE.map((action) => {
              const config = ACTION_CONFIG[action];
              return (
                <div key={action} className="flex items-center gap-1.5">
                  <div
                    className="w-3 h-3 rounded-sm border border-[#e5e5e5]"
                    style={{ backgroundColor: config.bg }}
                  />
                  <span className="text-xs text-[#666]">{config.label}</span>
                </div>
              );
            })}
          </div>

          {/* Summary Section */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-[#111] mb-4">
              Weekly Summary
            </h2>
            <div className="overflow-x-auto border border-[#e5e5e5] rounded-lg">
              <table
                className="w-full"
                style={{ borderCollapse: "collapse" }}
              >
                <thead>
                  <tr className="bg-[#f9fafb]">
                    <th className="border border-[#e5e5e5] px-3 py-2.5 text-left text-sm font-medium text-[#555] min-w-[140px]">
                      Metric
                    </th>
                    {DAYS.map((day) => (
                      <th
                        key={day.key}
                        className="border border-[#e5e5e5] px-3 py-2.5 text-center text-sm font-medium text-[#555]"
                        style={{ minWidth: 100 }}
                      >
                        {day.label}
                      </th>
                    ))}
                    <th className="border border-[#e5e5e5] px-3 py-2.5 text-center text-sm font-semibold text-[#111]" style={{ minWidth: 100 }}>
                      Weekly Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-[#e5e5e5] px-3 py-2 text-sm font-medium text-[#333]">
                      Total Stops
                    </td>
                    {summaryByDay.map((d) => (
                      <td
                        key={d.day}
                        className="border border-[#e5e5e5] px-3 py-2 text-center text-sm text-[#555]"
                      >
                        {d.stops}
                      </td>
                    ))}
                    <td className="border border-[#e5e5e5] px-3 py-2 text-center text-sm font-semibold text-[#111]">
                      {totalStops}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-[#e5e5e5] px-3 py-2 text-sm font-medium text-[#333]">
                      Estimated Hours
                    </td>
                    {summaryByDay.map((d) => (
                      <td
                        key={d.day}
                        className="border border-[#e5e5e5] px-3 py-2 text-center text-sm text-[#555]"
                      >
                        {d.hours.toFixed(1)}
                      </td>
                    ))}
                    <td className="border border-[#e5e5e5] px-3 py-2 text-center text-sm font-semibold text-[#111]">
                      {totalHours.toFixed(1)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-[#e5e5e5] px-3 py-2 text-sm font-medium text-[#333]">
                      Estimated Cost
                    </td>
                    {summaryByDay.map((d) => (
                      <td
                        key={d.day}
                        className="border border-[#e5e5e5] px-3 py-2 text-center text-sm text-[#555]"
                      >
                        ${(d.hours * hourlyRate).toFixed(0)}
                      </td>
                    ))}
                    <td className="border border-[#e5e5e5] px-3 py-2 text-center text-sm font-semibold text-[#111]">
                      ${totalCost.toFixed(0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
