import { calculateDuration, createSafeDate, getSlotFromDate } from "@/utils/tracker";
import { tz } from "@date-fns/tz";
import { UTCDate } from "@date-fns/utc";
import { format } from "date-fns";

/**
 * Converts user input time to UTC using @date-fns/utc
 * @param dateStr - Date in YYYY-MM-DD format
 * @param timeStr - Time in HH:MM format
 * @param timezone - IANA timezone identifier
 * @returns UTC Date object for database storage
 */
export const userTimeToUTC = (
  dateStr: string,
  timeStr: string,
  timezone: string,
): Date => {
  try {
    // Create a date in the user's timezone
    const tzDate = tz(timezone);
    const userDate = tzDate(`${dateStr} ${timeStr}`);

    // Return as a regular Date object (which is in UTC)
    return new Date(userDate.getTime());
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Timezone conversion failed, falling back to UTC:", {
        dateStr,
        timeStr,
        timezone,
        error,
      });
    }
    // Safe fallback: treat input as UTC using UTCDate
    return new UTCDate(`${dateStr}T${timeStr}:00Z`);
  }
};

/**
 * Displays UTC timestamp in user's preferred timezone using native APIs
 * @param utcDate - UTC Date from database
 * @param timezone - IANA timezone identifier
 * @returns Formatted time string (HH:MM)
 */
export const displayInUserTimezone = (utcDate: Date, timezone: string): string => {
  try {
    // Use native Intl API for reliable timezone conversion
    return utcDate.toLocaleString("en-US", {
      timeZone: timezone,
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Timezone display failed, using UTC:", { timezone, error });
    }
    // Fallback to UTC formatting
    return utcDate.toLocaleString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });
  }
};

/**
 * Converts UTC timestamp to visual slot position using tz() function
 * @param dateStr - UTC timestamp string or null
 * @param userTimezone - User's timezone for display
 * @returns Slot index (0 = midnight, 95 = 23:45)
 */
export const safeGetSlot = (dateStr: string | null, userTimezone?: string): number => {
  if (!dateStr) return 0;

  const utcDate = createSafeDate(dateStr);
  const timezone = userTimezone || "UTC";

  try {
    // Use tz() function to create timezone-aware date
    const createTZDate = tz(timezone);
    const tzDate = createTZDate(utcDate);

    const hour = tzDate.getHours();
    const minute = tzDate.getMinutes();
    const slot = hour * 4 + Math.floor(minute / 15);

    return slot;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Slot calculation failed, using native API:", {
        timezone,
        error,
      });
    }
    // Fallback to native toLocaleString
    const userTimeStr = utcDate.toLocaleString("en-US", {
      timeZone: timezone,
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });

    const [hourStr, minuteStr] = userTimeStr.split(":");
    const hour = Number(hourStr) || 0;
    const minute = Number(minuteStr) || 0;

    return hour * 4 + Math.floor(minute / 15);
  }
};

/**
 * Gets user's timezone with safe fallback
 * @param user - User object with timezone property
 * @returns IANA timezone string
 */
export const getUserTimezone = (user?: { timezone?: string | null }): string => {
  return user?.timezone || "UTC";
};

/**
 * Safely formats UTC timestamp for display using library functions
 * @param dateStr - UTC timestamp string
 * @param userTimezone - User's display timezone
 * @returns Formatted time string
 */
export const safeFormatTime = (
  dateStr: string | null,
  userTimezone?: string,
): string => {
  if (!dateStr) return "";

  try {
    const utcDate = createSafeDate(dateStr);
    const timezone = userTimezone || "UTC";

    // Try using tz() function first
    const createTZDate = tz(timezone);
    const tzDate = createTZDate(utcDate);

    return format(tzDate, "HH:mm");
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Time formatting with tz() failed, using native API:", error);
    }
    // Fallback to displayInUserTimezone
    return displayInUserTimezone(
      createSafeDate(dateStr),
      userTimezone || "UTC",
    );
  }
};

/**
 * Safely calculates duration between timestamps
 * @param start - Start timestamp string
 * @param stop - Stop timestamp string
 * @returns Duration in seconds
 */
export const safeCalculateDuration = (
  start: string | null,
  stop: string | null,
): number => {
  if (!start || !stop) return 0;
  return calculateDuration(createSafeDate(start), createSafeDate(stop));
};
