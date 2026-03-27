import type { RouterOutputs } from "@api/trpc/routers/_app";

export type TrackerRecord = NonNullable<
  RouterOutputs["trackerEntries"]["byDate"]["data"]
>[number];

export type ProcessedScheduleEntry = TrackerRecord & {
  isFirstPart: boolean;
  originalDuration: number | null;
  displayStart: string | null;
  displayStop: string | null;
};

export type PositionedScheduleEntry = ProcessedScheduleEntry & {
  column: number;
  totalColumns: number;
  width: number;
  left: number;
  leftPx?: number; // For pixel-based left positioning in cascading layout
};

export const ROW_HEIGHT = 36;
export const SLOT_HEIGHT = 9;
