import type { ProcessedScheduleEntry, PositionedScheduleEntry } from "./schedule-types";

/**
 * Detect if two events overlap in time
 */
const eventsOverlap = (
  event1: ProcessedScheduleEntry,
  event2: ProcessedScheduleEntry,
): boolean => {
  if (
    !event1.displayStart ||
    !event1.displayStop ||
    !event2.displayStart ||
    !event2.displayStop
  ) {
    return false;
  }

  const event1Start = new Date(event1.displayStart).getTime();
  const event1End = new Date(event1.displayStop).getTime();
  const event2Start = new Date(event2.displayStart).getTime();
  const event2End = new Date(event2.displayStop).getTime();

  return event1Start < event2End && event2Start < event1End;
};

/**
 * Group overlapping events and calculate positioning
 */
export const calculateScheduleEventPositions = (
  entries: ProcessedScheduleEntry[],
): PositionedScheduleEntry[] => {
  if (entries.length === 0) return [];

  // Sort events by start time, then by duration (longer events first)
  const sortedEntries = [...entries].sort((a, b) => {
    if (a.displayStart && b.displayStart) {
      const aStart = new Date(a.displayStart).getTime();
      const bStart = new Date(b.displayStart).getTime();
      if (aStart !== bStart) {
        return aStart - bStart;
      }
    }
    // If start times are the same, put longer events first
    const aDuration =
      a.displayStart && a.displayStop
        ? new Date(a.displayStop).getTime() - new Date(a.displayStart).getTime()
        : 0;
    const bDuration =
      b.displayStart && b.displayStop
        ? new Date(b.displayStop).getTime() - new Date(b.displayStart).getTime()
        : 0;
    return bDuration - aDuration;
  });

  // Build overlap groups using a more robust algorithm
  const overlapGroups: ProcessedScheduleEntry[][] = [];
  const processed = new Set<ProcessedScheduleEntry>();

  for (const entry of sortedEntries) {
    if (processed.has(entry)) continue;

    // Start a new group with this entry
    const currentGroup: ProcessedScheduleEntry[] = [entry];
    processed.add(entry);

    // Keep expanding the group until no more overlaps are found
    let foundNewOverlap = true;
    while (foundNewOverlap) {
      foundNewOverlap = false;

      for (const candidate of sortedEntries) {
        if (processed.has(candidate)) continue;

        // Check if this candidate overlaps with ANY event in the current group
        const overlapsWithGroup = currentGroup.some((groupEntry) =>
          eventsOverlap(candidate, groupEntry),
        );

        if (overlapsWithGroup) {
          currentGroup.push(candidate);
          processed.add(candidate);
          foundNewOverlap = true;
        }
      }
    }

    overlapGroups.push(currentGroup);
  }

  const positionedEntries: PositionedScheduleEntry[] = [];

  // Process each overlap group separately
  for (const group of overlapGroups) {
    if (group.length === 1) {
      // Single event - no overlap, use full width
      const entry = group[0];
      if (entry) {
        positionedEntries.push({
          ...entry,
          column: 0,
          totalColumns: 1,
          width: 100,
          left: 0,
        });
      }
    } else {
      // Multiple overlapping events - use cascading/staggered layout

      // Sort group by start time for proper stacking order
      const sortedGroup = [...group].sort((a, b) => {
        if (a.displayStart && b.displayStart) {
          const aStart = new Date(a.displayStart).getTime();
          const bStart = new Date(b.displayStart).getTime();
          if (aStart !== bStart) {
            return aStart - bStart;
          }
        }
        const aDuration =
          a.displayStart && a.displayStop
            ? new Date(a.displayStop).getTime() -
              new Date(a.displayStart).getTime()
            : 0;
        const bDuration =
          b.displayStart && b.displayStop
            ? new Date(b.displayStop).getTime() -
              new Date(b.displayStart).getTime()
            : 0;
        return bDuration - aDuration;
      });

      sortedGroup.forEach((entry, index) => {
        // Cascading layout parameters
        const offsetStep = 8; // Pixels to offset each event
        const baseWidth = 80; // Width for overlapping events (not the base)
        const widthReduction = 3; // How much to reduce width for each subsequent event

        // Calculate cascading properties
        const totalEvents = sortedGroup.length;

        // First event (index 0) gets full width, others get progressively smaller
        const width =
          index === 0
            ? 100
            : Math.max(60, baseWidth - (index - 1) * widthReduction);

        // Each event is offset to the right (except the first one)
        const leftOffset = index * offsetStep;
        const left = leftOffset;

        positionedEntries.push({
          ...entry,
          column: index,
          totalColumns: totalEvents,
          width,
          left,
          // Add a custom property for pixel-based left positioning
          leftPx: leftOffset,
        });
      });
    }
  }

  return positionedEntries;
};
