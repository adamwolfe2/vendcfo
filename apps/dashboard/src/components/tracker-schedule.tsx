"use client";

import { useLatestProjectId } from "@/hooks/use-latest-project-id";
import { useTrackerParams } from "@/hooks/use-tracker-params";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { parseDateAsUTC } from "@/utils/date";
import { secondsToHoursAndMinutes } from "@/utils/format";
import {
  NEW_EVENT_ID,
  calculateDuration,
  createSafeDate,
  formatHour,
  getDates,
  getSlotFromDate,
  isValidTimeSlot,
} from "@/utils/tracker";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import { TZDate } from "@date-fns/tz";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@vendcfo/ui/cn";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@vendcfo/ui/context-menu";
import { ScrollArea } from "@vendcfo/ui/scroll-area";
import {
  addDays,
  addMinutes,
  endOfDay,
  format,
  isValid,
  startOfDay,
} from "date-fns";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { TrackerEntriesForm } from "./forms/tracker-entries-form";
import { TrackerDaySelect } from "./tracker-day-select";
import {
  userTimeToUTC,
  safeGetSlot,
  getUserTimezone,
  safeFormatTime,
  safeCalculateDuration,
} from "./tracker-schedule/timezone-utils";
import type {
  TrackerRecord,
  ProcessedScheduleEntry,
} from "./tracker-schedule/schedule-types";
import { ROW_HEIGHT, SLOT_HEIGHT } from "./tracker-schedule/schedule-types";
import { calculateScheduleEventPositions } from "./tracker-schedule/schedule-positioning";
import { createNewEvent, updateEventTime } from "./tracker-schedule/event-helpers";
import { useTrackerData, useSelectedEvent } from "./tracker-schedule/use-tracker-data";

export function TrackerSchedule() {
  const { data: user } = useUserQuery();
  const {
    selectedDate,
    range,
    projectId: urlProjectId,
    eventId,
    setParams,
  } = useTrackerParams();
  const { latestProjectId } = useLatestProjectId(user?.teamId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const trpc = useTRPC();

  // Load projects to get project names
  const { data: projectsData } = useQuery(
    trpc.trackerProjects.get.queryOptions({
      pageSize: 100,
    }),
  );

  const {
    data,
    setData,
    totalDuration,
    deleteTrackerEntry,
    upsertTrackerEntry,
  } = useTrackerData(selectedDate);

  const { selectedEvent, selectEvent, clearNewEvent } = useSelectedEvent();

  // State to force re-render for running timers
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every 5 seconds for running timers
  useEffect(() => {
    // Check if any running timers exist (no stop time)
    const hasRunningTimers = data.some(
      (event) => !event.stop || event.stop === null,
    );

    if (hasRunningTimers) {
      const interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 5000); // Update every 5 seconds for better visual feedback

      return () => clearInterval(interval);
    }
  }, [data]);
  const hasScrolledForEventId = useRef<string | null>(null);

  // Auto-select event when eventId is present in URL
  useEffect(() => {
    if (eventId && data.length > 0) {
      const eventToSelect = data.find((event) => event.id === eventId);
      if (eventToSelect) {
        selectEvent(eventToSelect);

        // Auto-scroll to the event position only once per eventId
        if (scrollRef.current && hasScrolledForEventId.current !== eventId) {
          const userTimezone = getUserTimezone(user);
          const startSlot = safeGetSlot(eventToSelect.start, userTimezone);
          const scrollPosition = startSlot * SLOT_HEIGHT;

          // Add some padding to center the event better
          const containerHeight = scrollRef.current.clientHeight;
          const adjustedScrollPosition = Math.max(
            0,
            scrollPosition - containerHeight / 3,
          );

          scrollRef.current.scrollTo({
            top: adjustedScrollPosition,
            behavior: "smooth",
          });

          // Mark that we've scrolled for this eventId
          hasScrolledForEventId.current = eventId;
        }
      }
    }
  }, [eventId, data, selectEvent]);

  // Reset scroll tracking when eventId changes
  useEffect(() => {
    if (!eventId) {
      hasScrolledForEventId.current = null;
    }
  }, [eventId]);

  // Interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartSlot, setDragStartSlot] = useState<number | null>(null);
  const [resizingEvent, setResizingEvent] = useState<TrackerRecord | null>(
    null,
  );
  const [resizeStartY, setResizeStartY] = useState(0);
  const [resizeType, setResizeType] = useState<"top" | "bottom" | null>(null);
  const [movingEvent, setMovingEvent] = useState<TrackerRecord | null>(null);
  const [moveStartY, setMoveStartY] = useState(0);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    urlProjectId || latestProjectId || null,
  );

  // Update selectedProjectId when URL projectId or latestProjectId changes
  useEffect(() => {
    setSelectedProjectId(urlProjectId || latestProjectId || null);
  }, [urlProjectId, latestProjectId]);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const sortedRange = range?.sort((a, b) => a.localeCompare(b));

  // Scroll to appropriate time on mount (using user timezone)
  useEffect(() => {
    if (scrollRef.current) {
      let currentHour: number;
      try {
        const timezone = getUserTimezone(user);
        const now = new Date();
        const userTzDate = new TZDate(now, timezone);
        currentHour = userTzDate.getHours();
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.warn("TZDate current hour calculation failed:", error);
        }
        currentHour = new Date().getHours();
      }

      if (currentHour >= 12) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight });
      } else {
        scrollRef.current.scrollTo({ top: ROW_HEIGHT * 6 });
      }
    }
  }, [user]);

  // Event handlers
  const handleDeleteEvent = useCallback(
    (eventId: string) => {
      if (eventId !== NEW_EVENT_ID) {
        deleteTrackerEntry.mutate({ id: eventId });
        setData((prevData) => prevData.filter((event) => event.id !== eventId));
        selectEvent(null);
      }
    },
    [deleteTrackerEntry, setData, selectEvent],
  );

  const getBaseDate = useCallback(() => {
    if (selectedDate) {
      // Parse as UTC calendar date to avoid timezone shift
      return parseDateAsUTC(selectedDate);
    }

    // Get "today" in user's timezone, not browser timezone
    const userTimezone = getUserTimezone(user);
    try {
      const now = new Date();
      const userTzDate = new TZDate(now, userTimezone);
      return startOfDay(userTzDate);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("TZDate today calculation failed:", error);
      }
      return startOfDay(new Date());
    }
  }, [selectedDate, user]);

  const handleCreateEvent = useCallback(
    (formValues: {
      id?: string;
      duration: number;
      projectId: string;
      start: string;
      stop: string;
      assignedId?: string;
      description?: string;
    }) => {
      const baseDate = getBaseDate();
      const timezone = getUserTimezone(user);

      // Use selectedDate directly if available to avoid timezone conversion issues
      // Otherwise format baseDate (which is already timezone-aware from getBaseDate)
      const dateStr = selectedDate || format(baseDate, "yyyy-MM-dd");

      // Handle next day stop time (e.g., 23:00-01:00)
      const startHour = Number.parseInt(
        formValues.start.split(":")[0] || "0",
        10,
      );
      const stopHour = Number.parseInt(
        formValues.stop.split(":")[0] || "0",
        10,
      );
      const isNextDay = stopHour < startHour;

      // For next day calculation, use parseDateAsUTC to properly add a day
      const nextDayDate = selectedDate
        ? parseDateAsUTC(selectedDate)
        : baseDate;
      const stopDateStr = isNextDay
        ? format(addDays(nextDayDate, 1), "yyyy-MM-dd")
        : dateStr;

      // Convert user timezone input to UTC for storage
      const startDate = userTimeToUTC(dateStr, formValues.start, timezone);
      const stopDate = userTimeToUTC(stopDateStr, formValues.stop, timezone);

      if (!isValid(startDate) || !isValid(stopDate)) {
        if (process.env.NODE_ENV === "development") {
          console.warn("Invalid dates created:", { startDate, stopDate });
        }
        return;
      }

      // Calculate dates array based on where the user expects to see the entry
      // Store entries under the date where they visually start from the user's perspective
      let dates: string[];

      if (sortedRange && sortedRange.length > 0) {
        // For range selections, use the original range logic
        dates = getDates(selectedDate, sortedRange);
      } else {
        // For single date entries, store under the date the user selected
        // The UI will handle displaying the split correctly
        dates = [dateStr];
      }

      const apiData = {
        id: formValues.id === NEW_EVENT_ID ? undefined : formValues.id,
        start: startDate.toISOString(),
        stop: stopDate.toISOString(),
        dates,
        projectId: formValues.projectId,
        description: formValues.description || null,
        duration: formValues.duration,
        assignedId: user?.id || null,
      };

      upsertTrackerEntry.mutate(apiData);
    },
    [selectedDate, sortedRange, getBaseDate, upsertTrackerEntry, user],
  );

  const handleMouseDown = useCallback(
    (slot: number) => {
      if (!isValidTimeSlot(slot)) return;

      clearNewEvent(setData);
      setIsDragging(true);
      setDragStartSlot(slot);

      // Clear eventId when creating a new event
      if (eventId) {
        setParams({ eventId: null });
      }

      const newEvent = createNewEvent(
        slot,
        selectedProjectId,
        selectedDate,
        projectsData?.data,
        user,
      );
      setData((prevData) => [...prevData, newEvent]);
      selectEvent(newEvent);
    },
    [
      clearNewEvent,
      setData,
      selectedProjectId,
      selectedDate,
      selectEvent,
      projectsData,
      eventId,
      setParams,
      user?.timezone,
    ],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const slot = Math.floor(y / SLOT_HEIGHT);

      if (isDragging && dragStartSlot !== null && selectedEvent) {
        const start = Math.min(dragStartSlot, slot);
        const end = Math.max(dragStartSlot, slot);

        // Use selectedDate directly if available to avoid timezone conversion issues
        const dateStr = selectedDate || format(getBaseDate(), "yyyy-MM-dd");
        const timezone = getUserTimezone(user);
        const startHour = Math.floor(start / 4);
        const startMinute = (start % 4) * 15;
        const startTimeStr = `${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}`;

        const startDate = userTimeToUTC(dateStr, startTimeStr, timezone);
        const endDate = new Date(
          startDate.getTime() + (end - start + 1) * 15 * 60 * 1000,
        );

        const updatedEvent = updateEventTime(selectedEvent, startDate, endDate);
        setData((prevData) =>
          prevData.map((event) =>
            event.id === selectedEvent.id ? updatedEvent : event,
          ),
        );
        selectEvent(updatedEvent);
      } else if (resizingEvent && resizingEvent.id !== NEW_EVENT_ID) {
        const deltaY = e.clientY - resizeStartY;
        const deltaSlots = Math.round(deltaY / SLOT_HEIGHT);

        if (resizeType === "bottom") {
          const currentStop = createSafeDate(resizingEvent.stop);
          const newEnd = addMinutes(currentStop, deltaSlots * 15);
          const currentStart = createSafeDate(resizingEvent.start);
          const updatedEvent = updateEventTime(
            resizingEvent,
            currentStart,
            newEnd,
          );
          setData((prevData) =>
            prevData.map((event) =>
              event.id === resizingEvent.id ? updatedEvent : event,
            ),
          );
          selectEvent(updatedEvent);
        } else if (resizeType === "top") {
          const currentStart = createSafeDate(resizingEvent.start);
          const newStart = addMinutes(currentStart, deltaSlots * 15);
          const currentStop = createSafeDate(resizingEvent.stop);
          const updatedEvent = updateEventTime(
            resizingEvent,
            newStart,
            currentStop,
          );
          setData((prevData) =>
            prevData.map((event) =>
              event.id === resizingEvent.id ? updatedEvent : event,
            ),
          );
          selectEvent(updatedEvent);
        }
      } else if (movingEvent) {
        const deltaY = e.clientY - moveStartY;
        const deltaSlots = Math.round(deltaY / SLOT_HEIGHT);
        const currentStart = createSafeDate(movingEvent.start);
        const currentStop = createSafeDate(movingEvent.stop);
        const newStart = addMinutes(currentStart, deltaSlots * 15);
        const newEnd = addMinutes(currentStop, deltaSlots * 15);

        // Ensure the event doesn't move before start of day or after end of day
        const dayStart = startOfDay(currentStart);
        const dayEnd = endOfDay(currentStart);

        if (newStart >= dayStart && newEnd <= dayEnd) {
          const updatedEvent = updateEventTime(movingEvent, newStart, newEnd);
          setData((prevData) =>
            prevData.map((event) =>
              event.id === movingEvent.id ? updatedEvent : event,
            ),
          );
          selectEvent(updatedEvent);
        }
      }
    },
    [
      isDragging,
      dragStartSlot,
      selectedEvent,
      resizingEvent,
      resizeStartY,
      resizeType,
      movingEvent,
      moveStartY,
      getBaseDate,
      setData,
      selectEvent,
    ],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStartSlot(null);
    setResizingEvent(null);
    setResizeType(null);
    setMovingEvent(null);
  }, []);

  // Mouse event listeners
  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  // Keyboard shortcuts
  useHotkeys(
    "backspace",
    () => {
      if (selectedEvent && selectedEvent.id !== NEW_EVENT_ID) {
        handleDeleteEvent(selectedEvent.id);
      }
    },
    [selectedEvent, handleDeleteEvent],
  );

  const handleEventResizeStart = useCallback(
    (e: React.MouseEvent, event: TrackerRecord, type: "top" | "bottom") => {
      if (event.id !== NEW_EVENT_ID) {
        e.stopPropagation();
        setResizingEvent(event);
        setResizeStartY(e.clientY);
        setResizeType(type);
        selectEvent(event);
      }
    },
    [selectEvent],
  );

  const handleEventMoveStart = useCallback(
    (e: React.MouseEvent, event: TrackerRecord) => {
      e.stopPropagation();
      clearNewEvent(setData);
      setMovingEvent(event);
      setMoveStartY(e.clientY);
      selectEvent(event);
    },
    [clearNewEvent, setData, selectEvent],
  );

  const handleEventClick = useCallback(
    (event: TrackerRecord) => {
      clearNewEvent(setData);
      selectEvent(event);
    },
    [clearNewEvent, setData, selectEvent],
  );

  const handleTimeChange = useCallback(
    ({ start, end }: { start?: string; end?: string }) => {
      const baseDate = getBaseDate();
      let currentEvent = data.find((ev) => ev.id === selectedEvent?.id) || null;
      let eventCreated = false;

      const isCompleteStartTime =
        start && (/^\d{4}$/.test(start) || /^\d{2}:\d{2}$/.test(start));

      if (
        start &&
        isCompleteStartTime &&
        !currentEvent &&
        !data.some((ev) => ev.id === NEW_EVENT_ID)
      ) {
        // Format HHMM to HH:mm if necessary
        let formattedStartTimeStr = start;
        if (/^\d{4}$/.test(start)) {
          formattedStartTimeStr = `${start.substring(0, 2)}:${start.substring(2)}`;
        }

        // Use selectedDate directly if available to avoid timezone conversion issues
        const dateStr = selectedDate || format(baseDate, "yyyy-MM-dd");
        const timezone = getUserTimezone(user);
        const startTime = userTimeToUTC(
          dateStr,
          formattedStartTimeStr,
          timezone,
        );

        if (isValid(startTime)) {
          const endTime = new Date(startTime.getTime() + 15 * 60 * 1000);

          // Clear eventId when creating a new event
          if (eventId) {
            setParams({ eventId: null });
          }

          const timezone = getUserTimezone(user);
          const newEvent = createNewEvent(
            getSlotFromDate(startTime, timezone),
            selectedProjectId,
            selectedDate,
            projectsData?.data,
            user,
          );

          if (newEvent) {
            const timedNewEvent = updateEventTime(newEvent, startTime, endTime);
            setData((prevData) => [
              ...prevData.filter((ev) => ev.id !== NEW_EVENT_ID),
              timedNewEvent,
            ]);
            selectEvent(timedNewEvent);
            currentEvent = timedNewEvent;
            eventCreated = true;
          }
        }
      } else if (currentEvent && !eventCreated) {
        if (start !== undefined || end !== undefined) {
          let newStart: Date = createSafeDate(currentEvent.start);
          let startChanged = false;

          if (start !== undefined) {
            const isCompleteFormat =
              /^\d{4}$/.test(start) || /^\d{2}:\d{2}$/.test(start);
            if (isCompleteFormat) {
              let formattedStart = start;
              if (/^\d{4}$/.test(start))
                formattedStart = `${start.substring(0, 2)}:${start.substring(2)}`;

              // Use selectedDate directly if available to avoid timezone conversion issues
              const dateStr = selectedDate || format(baseDate, "yyyy-MM-dd");
              const timezone = getUserTimezone(user);
              const parsedStart = userTimeToUTC(
                dateStr,
                formattedStart,
                timezone,
              );

              if (
                isValid(parsedStart) &&
                parsedStart.getTime() !== newStart.getTime()
              ) {
                newStart = parsedStart;
                startChanged = true;
              }
            }
          }

          let newEnd: Date = createSafeDate(currentEvent.stop);
          let endChanged = false;

          if (end !== undefined) {
            const isCompleteFormat =
              /^\d{4}$/.test(end) || /^\d{2}:\d{2}$/.test(end);
            if (isCompleteFormat) {
              let formattedEnd = end;
              if (/^\d{4}$/.test(end))
                formattedEnd = `${end.substring(0, 2)}:${end.substring(2)}`;

              // Use selectedDate directly if available to avoid timezone conversion issues
              const dateStr = selectedDate || format(baseDate, "yyyy-MM-dd");
              const timezone = getUserTimezone(user);
              const parsedEnd = userTimeToUTC(dateStr, formattedEnd, timezone);

              if (
                isValid(parsedEnd) &&
                parsedEnd.getTime() !== newEnd.getTime()
              ) {
                newEnd = parsedEnd;
                endChanged = true;
              }
            }
          }

          if (
            (startChanged || endChanged) &&
            isValid(newStart) &&
            isValid(newEnd)
          ) {
            // If end time is before start time, assume it's on the next day
            if (newEnd < newStart) {
              newEnd = addDays(newEnd, 1);
            }

            const updatedEvent = updateEventTime(
              currentEvent,
              newStart,
              newEnd,
            );
            setData((prevData) =>
              prevData.map((event) =>
                event.id === currentEvent?.id ? updatedEvent : event,
              ),
            );
            if (selectedEvent?.id === currentEvent.id) {
              selectEvent(updatedEvent);
            }
          }
        }
      }
    },
    [
      getBaseDate,
      data,
      selectedEvent,
      selectedProjectId,
      selectedDate,
      setData,
      selectEvent,
      projectsData,
      eventId,
      setParams,
      user?.timezone,
    ],
  );

  const handleSelectProject = useCallback(
    (project: { id: string; name: string }) => {
      setSelectedProjectId(project.id);

      const eventToUpdate = data.find((ev) => ev.id === selectedEvent?.id);
      if (eventToUpdate) {
        const updatedEvent = {
          ...eventToUpdate,
          trackerProject: {
            id: project.id,
            name: project.name,
            currency: null,
            rate: null,
            customer: null,
          },
        };

        setData((prevData) =>
          prevData.map((ev) =>
            ev.id === eventToUpdate.id ? updatedEvent : ev,
          ),
        );

        selectEvent(updatedEvent);

        if (eventToUpdate.id !== NEW_EVENT_ID) {
          const duration = safeCalculateDuration(
            eventToUpdate.start,
            eventToUpdate.stop,
          );
          handleCreateEvent({
            id: eventToUpdate.id,
            start: safeFormatTime(
              eventToUpdate.start,
              user?.timezone ? user.timezone : undefined,
            ),
            stop: safeFormatTime(
              eventToUpdate.stop,
              user?.timezone ? user.timezone : undefined,
            ),
            projectId: project.id,
            description: eventToUpdate.description ?? undefined,
            duration: duration,
          });
        }
      }
    },
    [
      data,
      selectedEvent,
      setData,
      selectEvent,
      handleCreateEvent,
      user?.timezone,
    ],
  );

  const renderScheduleEntries = () => {
    // Process events to handle midnight spanning
    const processedEntries: ProcessedScheduleEntry[] = [];

    if (data) {
      for (const event of data) {
        const startDate = createSafeDate(event.start);
        const endDate = createSafeDate(event.stop);

        // Check if this entry spans midnight by comparing dates in user timezone
        const timezone = getUserTimezone(user);

        // Use TZDate for reliable timezone conversion
        let spansMidnight: boolean;
        let startDateStr: string;
        try {
          const startTzDate = new TZDate(startDate, timezone);
          const endTzDate = new TZDate(endDate, timezone);
          // Use date-fns format with timezone-aware dates
          startDateStr = format(startTzDate, "yyyy-MM-dd");
          const endDateStr = format(endTzDate, "yyyy-MM-dd");

          spansMidnight = startDateStr !== endDateStr;
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.warn("TZDate midnight detection failed:", error);
          }
          // Fallback to toLocaleString
          startDateStr = startDate.toLocaleString("en-CA", {
            timeZone: timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          });
          const endDateStr = endDate.toLocaleString("en-CA", {
            timeZone: timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          });
          spansMidnight = startDateStr !== endDateStr;
        }

        if (spansMidnight) {
          // This is a split entry - only show the first part (with → arrow)
          // Get current date in user timezone for midnight-spanning comparison
          let currentSelectedDate: string;
          if (selectedDate) {
            currentSelectedDate = selectedDate;
          } else {
            const timezone = getUserTimezone(user);
            try {
              const now = new Date();
              const userTzDate = new TZDate(now, timezone);
              currentSelectedDate = format(userTzDate, "yyyy-MM-dd");
            } catch (error) {
              if (process.env.NODE_ENV === "development") {
                console.warn("TZDate today formatting failed:", error);
              }
              currentSelectedDate = format(new Date(), "yyyy-MM-dd");
            }
          }

          if (startDateStr === currentSelectedDate) {
            // This is the first part of the entry (ends at midnight in user timezone)
            // Calculate end of day in user timezone, then convert back to UTC
            const timezone = getUserTimezone(user);
            // Parse as UTC calendar date to avoid timezone shift when adding days
            const currentDateUTC = parseDateAsUTC(currentSelectedDate);
            const nextDay = format(addDays(currentDateUTC, 1), "yyyy-MM-dd");
            const endOfDayUtc = userTimeToUTC(nextDay, "00:00", timezone);

            const firstPartDuration = Math.round(
              (endOfDayUtc.getTime() - startDate.getTime()) / 1000,
            );

            processedEntries.push({
              ...event,
              duration: firstPartDuration,
              isFirstPart: true,
              originalDuration: event.duration ?? null,
              displayStart: event.start ?? null,
              displayStop: endOfDayUtc.toISOString() ?? null,
            });
          }
          // Skip the continuation part for the next day
        } else {
          // Normal entry that doesn't span midnight
          processedEntries.push({
            ...event,
            isFirstPart: false,
            originalDuration: event.duration ?? null,
            displayStart: event.start ?? null,
            displayStop: event.stop ?? null,
          });
        }
      }
    }

    // Calculate positions for overlapping events
    const positionedEntries = calculateScheduleEventPositions(processedEntries);

    return positionedEntries.map((event) => {
      const userTimezone = getUserTimezone(user);
      const startSlot = safeGetSlot(event.displayStart, userTimezone);
      let endSlot: number;
      let isRunningTimer = false;

      // Check if this is a running timer (no stop time)
      if (!event.displayStop || event.stop === null) {
        isRunningTimer = true;
        // Calculate current time slot for running timer using state
        const currentSlot = safeGetSlot(
          currentTime.toISOString(),
          userTimezone,
        );
        // Ensure running timer doesn't extend beyond current time
        endSlot = Math.max(startSlot + 1, currentSlot); // At least 1 slot minimum
      } else {
        // For midnight-spanning entries, extend to end of day
        if (event.isFirstPart) {
          endSlot = 96; // 24 hours * 4 slots = 96 (end of day)
        } else {
          endSlot = safeGetSlot(event.displayStop, userTimezone);
          // Handle midnight crossing - if end slot is before start slot,
          // it means the entry crosses midnight, so extend to end of day
          if (endSlot < startSlot) {
            endSlot = 96; // 24 hours * 4 slots = 96 (end of day)
          }
        }
      }

      // Calculate actual height but enforce minimum for usability
      const actualHeight = (endSlot - startSlot) * SLOT_HEIGHT;
      const minHeight = 24; // Minimum height for interaction (resize handles + content)
      const height = Math.max(actualHeight, minHeight);

      return (
        <ContextMenu
          key={`${event.id}-${event.isFirstPart ? "first" : "normal"}`}
          onOpenChange={(open) => {
            if (!open) {
              setTimeout(() => setIsContextMenuOpen(false), 50);
            } else {
              setIsContextMenuOpen(true);
            }
          }}
        >
          <ContextMenuTrigger>
            <div
              onClick={() => handleEventClick(event)}
              className={cn(
                "absolute transition-colors",
                // Same styling for all events
                "bg-[#F0F0F0]/[0.95]/[0.95] text-[#606060] border-t border-border",
                selectedEvent?.id === event.id && "!text-primary",
                event.id !== NEW_EVENT_ID && "cursor-move",
                event.totalColumns > 1 && event.column > 0
                  ? "border border-border"
                  : "",
              )}
              style={{
                top: `${startSlot * SLOT_HEIGHT}px`,
                height: `${height}px`,
                left:
                  event.leftPx !== undefined
                    ? `${event.leftPx}px`
                    : `${event.left}%`,
                width:
                  event.leftPx !== undefined
                    ? `calc(${event.width}% - ${event.leftPx}px)`
                    : `${event.width}%`,
                zIndex: event.totalColumns > 1 ? 20 + event.column : 10,
              }}
              onMouseDown={(e) =>
                event.id !== NEW_EVENT_ID && handleEventMoveStart(e, event)
              }
            >
              <div className="text-xs p-4 flex justify-between flex-col select-none pointer-events-none">
                <div className="flex items-center gap-2">
                  {/* Subtle green dot indicator for running timers */}
                  {isRunningTimer && (
                    <div className="flex items-center">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                      </span>
                    </div>
                  )}
                  <span>
                    {event.trackerProject?.name || "No Project"}
                    {event.isFirstPart && " →"}
                    {isRunningTimer
                      ? ` (${secondsToHoursAndMinutes(Math.max(0, Math.round((currentTime.getTime() - createSafeDate(event.start).getTime()) / 1000)))})`
                      : ` (${secondsToHoursAndMinutes(event.duration ?? 0)})`}
                  </span>
                </div>
                {event?.trackerProject?.customer && (
                  <span>{event.trackerProject.customer.name}</span>
                )}
                <span>{event.description}</span>
              </div>
              {event.id !== NEW_EVENT_ID && !isRunningTimer && (
                <>
                  <div
                    className="absolute top-0 left-0 right-0 h-3 cursor-ns-resize"
                    onMouseDown={(e) => handleEventResizeStart(e, event, "top")}
                  />
                  <div
                    className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize"
                    onMouseDown={(e) =>
                      handleEventResizeStart(e, event, "bottom")
                    }
                  />
                </>
              )}
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteEvent(event.id);
              }}
            >
              Delete <ContextMenuShortcut>⌫</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
    });
  };

  // Find the event to pass to the form
  const formEvent =
    data.find((event) => event.id === NEW_EVENT_ID) || selectedEvent;

  return (
    <div className="w-full">
      <div className="text-left mb-8">
        <h2 className="text-xl text-[#878787]">
          {secondsToHoursAndMinutes(totalDuration)}
        </h2>
      </div>

      <TrackerDaySelect />

      <ScrollArea ref={scrollRef} className="h-[calc(100vh-530px)] mt-8">
        <div className="flex text-[#878787] text-xs">
          <div className="w-20 flex-shrink-0 select-none">
            {hours.map((hour) => (
              <div
                key={hour}
                className="pr-4 flex flex-col"
                style={{ height: `${ROW_HEIGHT}px` }}
              >
                {formatHour(hour, user?.timeFormat, getUserTimezone(user))}
              </div>
            ))}
          </div>

          <div
            className="relative flex-grow border border-border border-t-0 cursor-default select-none"
            onMouseMove={handleMouseMove}
            onMouseDown={(e) => {
              if (e.button === 0 && !isContextMenuOpen) {
                const rect = e.currentTarget.getBoundingClientRect();
                const y = e.clientY - rect.top;
                const slot = Math.floor(y / SLOT_HEIGHT);
                handleMouseDown(slot);
              }
            }}
          >
            {hours.map((hour) => (
              <React.Fragment key={hour}>
                <div
                  className="absolute w-full border-t border-border user-select-none"
                  style={{ top: `${hour * ROW_HEIGHT}px` }}
                />
              </React.Fragment>
            ))}
            {renderScheduleEntries()}
          </div>
        </div>
      </ScrollArea>

      <TrackerEntriesForm
        key={formEvent?.id === NEW_EVENT_ID ? "new" : (formEvent?.id ?? "new")}
        eventId={formEvent?.id}
        onCreate={handleCreateEvent}
        isSaving={upsertTrackerEntry.isPending}
        userId={user?.id || ""}
        teamId={user?.teamId || ""}
        projectId={formEvent?.trackerProject?.id ?? selectedProjectId}
        description={formEvent?.description ?? undefined}
        start={
          formEvent?.start
            ? safeFormatTime(
                formEvent.start,
                user?.timezone ? user.timezone : undefined,
              )
            : undefined
        }
        stop={
          formEvent?.stop
            ? safeFormatTime(
                formEvent.stop,
                user?.timezone ? user.timezone : undefined,
              )
            : undefined
        }
        onSelectProject={handleSelectProject}
        onTimeChange={handleTimeChange}
      />
    </div>
  );
}
