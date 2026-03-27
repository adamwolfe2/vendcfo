import { parseDateAsUTC } from "@/utils/date";
import {
  NEW_EVENT_ID,
  calculateDuration,
  createSafeDate,
} from "@/utils/tracker";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import { TZDate } from "@date-fns/tz";
import { format, startOfDay } from "date-fns";
import type { TrackerRecord } from "./schedule-types";
import { getUserTimezone, userTimeToUTC } from "./timezone-utils";

/**
 * Creates new tracker event from user interaction
 * @param slot - Visual slot position (0-95)
 * @param selectedProjectId - Project ID or null
 * @param selectedDate - Date string or null
 * @param projects - Available projects data
 * @param user - User object with timezone
 * @returns New TrackerRecord
 */
export const createNewEvent = (
  slot: number,
  selectedProjectId: string | null,
  selectedDate?: string | null,
  projects?: RouterOutputs["trackerProjects"]["get"]["data"],
  user?: { timezone?: string | null },
): TrackerRecord => {
  // Get base date for event
  let baseDate: Date;
  let dateStr: string;
  if (selectedDate) {
    // Parse as UTC calendar date to avoid timezone shift
    baseDate = parseDateAsUTC(selectedDate);
    dateStr = selectedDate; // Use the original date string directly
  } else {
    const timezone = getUserTimezone(user);
    try {
      const now = new Date();
      const userTzDate = new TZDate(now, timezone);
      baseDate = startOfDay(userTzDate);
      dateStr = format(userTzDate, "yyyy-MM-dd"); // Format in user's timezone
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Today calculation failed, using system date:", error);
      }
      baseDate = new Date();
      dateStr = format(baseDate, "yyyy-MM-dd");
    }
  }
  const timezone = getUserTimezone(user);

  // Convert slot to time
  const hour = Math.floor(slot / 4);
  const minute = (slot % 4) * 15;
  const startTimeStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  // 15-minute default duration
  const endMinute = minute + 15;
  const endHour = endMinute >= 60 ? hour + 1 : hour;
  const finalEndMinute = endMinute >= 60 ? endMinute - 60 : endMinute;
  const endTimeStr = `${String(endHour).padStart(2, "0")}:${String(finalEndMinute).padStart(2, "0")}`;

  // Convert to UTC for storage
  const startDate = userTimeToUTC(dateStr, startTimeStr, timezone);
  const endDate = userTimeToUTC(dateStr, endTimeStr, timezone);

  // Find project details
  const selectedProject = projects?.find((p) => p.id === selectedProjectId);

  return {
    id: NEW_EVENT_ID,
    date: dateStr,
    description: null,
    duration: 15 * 60,
    start: startDate.toISOString(),
    stop: endDate.toISOString(),
    user: null,
    trackerProject: selectedProjectId
      ? {
          id: selectedProjectId,
          name: selectedProject?.name || "",
          currency: selectedProject?.currency || null,
          rate: selectedProject?.rate || null,
          customer: selectedProject?.customer || null,
        }
      : null,
  };
};

export const updateEventTime = (
  event: TrackerRecord,
  start: Date,
  stop: Date,
): TrackerRecord => {
  return {
    ...event,
    start: start.toISOString(),
    stop: stop.toISOString(),
    duration: calculateDuration(start, stop),
  };
};
