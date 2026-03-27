import { useTrackerParams } from "@/hooks/use-tracker-params";
import { useTRPC } from "@/trpc/client";
import { NEW_EVENT_ID } from "@/utils/tracker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import type { TrackerRecord } from "./schedule-types";

// Hook for managing tracker data
export const useTrackerData = (selectedDate: string | null) => {
  const trpc = useTRPC();
  const { setParams: setTrackerParams } = useTrackerParams();
  const queryClient = useQueryClient();
  const [data, setData] = useState<TrackerRecord[]>([]);
  const [totalDuration, setTotalDuration] = useState(0);

  const { data: trackerData, refetch } = useQuery({
    ...trpc.trackerEntries.byDate.queryOptions(
      { date: selectedDate ?? "" },
      {
        enabled: !!selectedDate,
      },
    ),
  });

  const deleteTrackerEntry = useMutation(
    trpc.trackerEntries.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.trackerEntries.byRange.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.trackerProjects.get.infiniteQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.widgets.getBillableHours.queryKey(),
        });
        refetch();
      },
    }),
  );

  const upsertTrackerEntry = useMutation(
    trpc.trackerEntries.upsert.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.trackerEntries.byRange.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.trackerProjects.get.infiniteQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.widgets.getBillableHours.queryKey(),
        });
        refetch();

        // Close the tracker project form
        setTrackerParams({ selectedDate: null });
      },
    }),
  );

  // Process API data
  useEffect(() => {
    if (trackerData?.data) {
      setData(trackerData.data);
      setTotalDuration(trackerData.meta?.totalDuration || 0);
    } else {
      setData([]);
      setTotalDuration(0);
    }
  }, [trackerData]);

  return {
    data,
    setData,
    totalDuration,
    deleteTrackerEntry,
    upsertTrackerEntry,
  };
};

// Hook for managing selected event
export const useSelectedEvent = () => {
  const [selectedEvent, setSelectedEvent] = useState<TrackerRecord | null>(
    null,
  );

  const selectEvent = useCallback((event: TrackerRecord | null) => {
    setSelectedEvent(event);
  }, []);

  const clearNewEvent = useCallback(
    (setData: React.Dispatch<React.SetStateAction<TrackerRecord[]>>) => {
      if (selectedEvent?.id === NEW_EVENT_ID) {
        setData((prevData) => prevData.filter((e) => e.id !== NEW_EVENT_ID));
        setSelectedEvent(null);
      }
    },
    [selectedEvent],
  );

  return {
    selectedEvent,
    selectEvent,
    clearNewEvent,
  };
};
