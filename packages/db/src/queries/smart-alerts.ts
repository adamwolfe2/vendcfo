/**
 * Smart Alerts Engine
 *
 * Generates data-driven alerts by checking business metrics against
 * thresholds. Works with Supabase client (vending tables are not in Drizzle).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SmartAlertResult {
  type:
    | "revenue_drop"
    | "overdue_service"
    | "overdue_invoice"
    | "machine_down"
    | "capacity_warning";
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  entityId?: string;
  entityName?: string;
  actionLabel?: string;
  actionHref?: string;
  metadata?: Record<string, unknown>;
}

interface RevenueRecord {
  location_id: string | null;
  gross_revenue: string;
  period_start: string;
  period_end: string;
}

interface LocationRow {
  id: string;
  name: string;
  service_frequency_days: number | null;
}

interface MachineRow {
  id: string;
  serial_number: string;
  location_id: string | null;
  is_active: boolean;
  locations: { name: string } | null;
}

interface InvoiceRow {
  id: string;
  invoice_number: string | null;
  amount: number;
  due_date: string;
  status: string;
  currency: string;
}

interface ScheduleRow {
  location_id: string;
  day_of_week: number;
  updated_at: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toNum(val: string | number | null | undefined): number {
  return Number(val) || 0;
}

function daysBetween(dateA: Date, dateB: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor(Math.abs(dateB.getTime() - dateA.getTime()) / msPerDay);
}

function getWeekRange(offsetWeeks: number): { start: string; end: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - mondayOffset + offsetWeeks * 7);
  thisMonday.setHours(0, 0, 0, 0);

  const sunday = new Date(thisMonday);
  sunday.setDate(thisMonday.getDate() + 6);

  const start = thisMonday.toISOString().split("T")[0] as string;
  const end = sunday.toISOString().split("T")[0] as string;
  return { start, end };
}

function fmtCurrency(n: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(n);
}

// ---------------------------------------------------------------------------
// Main Generator
// ---------------------------------------------------------------------------

/**
 * Generate smart alerts for a team by checking multiple data sources.
 * Uses Supabase client directly since vending tables are not in Drizzle.
 */
export async function generateSmartAlerts(
  supabase: any,
  teamId: string,
): Promise<SmartAlertResult[]> {
  const alerts: SmartAlertResult[] = [];

  const [revenueAlerts, serviceAlerts, invoiceAlerts, machineAlerts] =
    await Promise.all([
      checkRevenueDrops(supabase, teamId),
      checkOverdueServices(supabase, teamId),
      checkOverdueInvoices(supabase, teamId),
      checkZeroRevenueMachines(supabase, teamId),
    ]);

  alerts.push(...revenueAlerts);
  alerts.push(...serviceAlerts);
  alerts.push(...invoiceAlerts);
  alerts.push(...machineAlerts);

  // Sort by severity: critical first, then warning, then info
  const severityOrder: Record<string, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };
  alerts.sort(
    (a, b) =>
      (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3),
  );

  return alerts;
}

// ---------------------------------------------------------------------------
// 1. Revenue Drops — compare this week vs last week per location
// ---------------------------------------------------------------------------

async function checkRevenueDrops(
  supabase: any,
  teamId: string,
): Promise<SmartAlertResult[]> {
  const alerts: SmartAlertResult[] = [];

  const thisWeek = getWeekRange(0);
  const lastWeek = getWeekRange(-1);

  const [thisWeekRes, lastWeekRes, locationsRes] = await Promise.all([
    supabase
      .from("revenue_records")
      .select("location_id, gross_revenue")
      .eq("business_id", teamId)
      .gte("period_start", thisWeek.start)
      .lte("period_end", thisWeek.end),
    supabase
      .from("revenue_records")
      .select("location_id, gross_revenue")
      .eq("business_id", teamId)
      .gte("period_start", lastWeek.start)
      .lte("period_end", lastWeek.end),
    supabase
      .from("locations")
      .select("id, name")
      .eq("business_id", teamId)
      .eq("is_active", true),
  ]);

  const thisWeekData = (thisWeekRes.data ?? []) as RevenueRecord[];
  const lastWeekData = (lastWeekRes.data ?? []) as RevenueRecord[];
  const locations = (locationsRes.data ?? []) as LocationRow[];

  const locMap = new Map(locations.map((l) => [l.id, l.name]));

  // Aggregate by location
  const thisWeekByLoc = new Map<string, number>();
  for (const rec of thisWeekData) {
    if (!rec.location_id) continue;
    thisWeekByLoc.set(
      rec.location_id,
      (thisWeekByLoc.get(rec.location_id) ?? 0) + toNum(rec.gross_revenue),
    );
  }

  const lastWeekByLoc = new Map<string, number>();
  for (const rec of lastWeekData) {
    if (!rec.location_id) continue;
    lastWeekByLoc.set(
      rec.location_id,
      (lastWeekByLoc.get(rec.location_id) ?? 0) + toNum(rec.gross_revenue),
    );
  }

  for (const [locId, lastRev] of lastWeekByLoc) {
    if (lastRev <= 0) continue;
    const thisRev = thisWeekByLoc.get(locId) ?? 0;
    const dropPct = ((lastRev - thisRev) / lastRev) * 100;

    if (dropPct >= 20) {
      const locName = locMap.get(locId) ?? "Unknown Location";
      alerts.push({
        type: "revenue_drop",
        severity: dropPct >= 50 ? "critical" : "warning",
        title: "Revenue Drop",
        message: `${locName} revenue dropped ${Math.round(dropPct)}% vs last week (${fmtCurrency(lastRev)} to ${fmtCurrency(thisRev)})`,
        entityId: locId,
        entityName: locName,
        actionLabel: "View Location",
        actionHref: "/locations",
        metadata: { dropPct, thisRev, lastRev },
      });
    }
  }

  return alerts;
}

// ---------------------------------------------------------------------------
// 2. Overdue Services — locations not serviced within their frequency target
// ---------------------------------------------------------------------------

async function checkOverdueServices(
  supabase: any,
  teamId: string,
): Promise<SmartAlertResult[]> {
  const alerts: SmartAlertResult[] = [];

  const [locationsRes, schedulesRes] = await Promise.all([
    supabase
      .from("locations")
      .select("id, name, service_frequency_days")
      .eq("business_id", teamId)
      .eq("is_active", true),
    supabase
      .from("service_schedule")
      .select("location_id, day_of_week, updated_at")
      .eq("business_id", teamId),
  ]);

  const locations = (locationsRes.data ?? []) as LocationRow[];
  const schedules = (schedulesRes.data ?? []) as ScheduleRow[];

  // Group schedules by location, find most recent activity
  const scheduleByLoc = new Map<string, ScheduleRow[]>();
  for (const sched of schedules) {
    const existing = scheduleByLoc.get(sched.location_id) ?? [];
    existing.push(sched);
    scheduleByLoc.set(sched.location_id, existing);
  }

  const now = new Date();

  for (const loc of locations) {
    const targetDays = loc.service_frequency_days;
    if (!targetDays || targetDays <= 0) continue;

    const locSchedules = scheduleByLoc.get(loc.id);
    if (!locSchedules || locSchedules.length === 0) {
      // No schedule at all -- flag it
      alerts.push({
        type: "overdue_service",
        severity: "warning",
        title: "No Service Schedule",
        message: `${loc.name} has no service schedule (target: every ${targetDays} days)`,
        entityId: loc.id,
        entityName: loc.name,
        actionLabel: "Schedule Service",
        actionHref: "/logistics",
        metadata: { targetDays },
      });
      continue;
    }

    // Estimate days since last service from schedule pattern
    // Use the latest updated_at as a proxy for last service
    const latestUpdate = locSchedules
      .filter((s) => s.updated_at)
      .map((s) => new Date(s.updated_at!))
      .sort((a, b) => b.getTime() - a.getTime())[0];

    if (latestUpdate) {
      const daysSince = daysBetween(latestUpdate, now);
      if (daysSince > targetDays) {
        alerts.push({
          type: "overdue_service",
          severity: daysSince > targetDays * 2 ? "critical" : "warning",
          title: "Overdue Service",
          message: `${loc.name} hasn't been serviced in ${daysSince} days (target: every ${targetDays} days)`,
          entityId: loc.id,
          entityName: loc.name,
          actionLabel: "Schedule Service",
          actionHref: "/logistics",
          metadata: { daysSince, targetDays },
        });
      }
    }
  }

  return alerts;
}

// ---------------------------------------------------------------------------
// 3. Overdue Invoices — invoices past due date and not paid
// ---------------------------------------------------------------------------

async function checkOverdueInvoices(
  supabase: any,
  teamId: string,
): Promise<SmartAlertResult[]> {
  const alerts: SmartAlertResult[] = [];
  const today = new Date().toISOString().split("T")[0] as string;

  // Get invoices that are overdue or unpaid with past due date
  const { data: overdueInvoices } = await supabase
    .from("invoices")
    .select("id, invoice_number, amount, due_date, status, currency")
    .eq("team_id", teamId)
    .in("status", ["overdue", "unpaid"])
    .lte("due_date", today)
    .order("due_date", { ascending: true });

  const invoices = (overdueInvoices ?? []) as InvoiceRow[];

  for (const inv of invoices) {
    const daysOverdue = daysBetween(new Date(inv.due_date), new Date());
    const amount = toNum(inv.amount);
    const invoiceLabel = inv.invoice_number ?? inv.id.slice(0, 8);

    alerts.push({
      type: "overdue_invoice",
      severity:
        daysOverdue >= 30 ? "critical" : daysOverdue >= 14 ? "warning" : "info",
      title: "Overdue Invoice",
      message: `Invoice #${invoiceLabel} is ${daysOverdue} days overdue (${fmtCurrency(amount, inv.currency || "USD")})`,
      entityId: inv.id,
      entityName: `Invoice #${invoiceLabel}`,
      actionLabel: "View Invoice",
      actionHref: "/invoices",
      metadata: { daysOverdue, amount, currency: inv.currency },
    });
  }

  return alerts;
}

// ---------------------------------------------------------------------------
// 4. Zero-Revenue Machines — machines with no revenue in last 14 days
// ---------------------------------------------------------------------------

async function checkZeroRevenueMachines(
  supabase: any,
  teamId: string,
): Promise<SmartAlertResult[]> {
  const alerts: SmartAlertResult[] = [];

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const cutoffDate = fourteenDaysAgo.toISOString().split("T")[0] as string;

  // Get all active machines
  const { data: machinesData } = await supabase
    .from("machines")
    .select("id, serial_number, location_id, is_active, locations(name)")
    .eq("business_id", teamId)
    .eq("is_active", true);

  const machines = (machinesData ?? []) as MachineRow[];

  if (machines.length === 0) return alerts;

  // Get revenue records for last 14 days grouped by location
  const { data: recentRevData } = await supabase
    .from("revenue_records")
    .select("location_id, gross_revenue")
    .eq("business_id", teamId)
    .gte("period_start", cutoffDate);

  const recentRev = (recentRevData ?? []) as RevenueRecord[];

  // Locations with revenue in last 14 days
  const locationsWithRevenue = new Set<string>();
  for (const rec of recentRev) {
    if (rec.location_id && toNum(rec.gross_revenue) > 0) {
      locationsWithRevenue.add(rec.location_id);
    }
  }

  // Find machines at locations with zero revenue
  for (const machine of machines) {
    if (!machine.location_id) continue;
    if (locationsWithRevenue.has(machine.location_id)) continue;

    const locationName = (machine.locations as any)?.name ?? "Unknown Location";

    alerts.push({
      type: "machine_down",
      severity: "warning",
      title: "Machine Down",
      message: `Machine ${machine.serial_number} at ${locationName} has $0 revenue for 14+ days`,
      entityId: machine.id,
      entityName: machine.serial_number,
      actionLabel: "Check Machine",
      actionHref: "/machines",
      metadata: { locationId: machine.location_id, locationName },
    });
  }

  return alerts;
}
