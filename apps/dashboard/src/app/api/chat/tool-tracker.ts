import { db } from "@vendcfo/db/client";
import { trackerProjects, trackerEntries } from "@vendcfo/db/schema";
import { eq, sql, count } from "drizzle-orm";
import { handleToolError } from "./tool-helpers";

export async function queryTrackerData(
  input: {
    query_type?: string;
    period?: string;
  },
  teamId: string,
): Promise<string> {
  try {
  const projects = await db
    .select({
      id: trackerProjects.id,
      name: trackerProjects.name,
      rate: trackerProjects.rate,
      status: trackerProjects.status,
    })
    .from(trackerProjects)
    .where(eq(trackerProjects.teamId, teamId));

  const [hoursSummary] = await db
    .select({
      totalDuration: sql<number>`COALESCE(SUM(${trackerEntries.duration}), 0)`,
      entryCount: count(),
    })
    .from(trackerEntries)
    .where(eq(trackerEntries.teamId, teamId));

  const totalHours = Number(hoursSummary?.totalDuration || 0) / 3600;

  return JSON.stringify({
    type: "tracker",
    projects: projects,
    total_hours: Number(totalHours.toFixed(1)),
    total_entries: Number(hoursSummary?.entryCount || 0),
  });
  } catch (error) {
    return handleToolError(error);
  }
}
