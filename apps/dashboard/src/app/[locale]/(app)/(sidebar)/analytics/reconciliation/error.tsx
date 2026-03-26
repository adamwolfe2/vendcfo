"use client";

import { AlertTriangle } from "lucide-react";

export default function ReconciliationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-20 text-center">
      <AlertTriangle
        className="mx-auto mb-4 text-[#bbb]"
        size={40}
        strokeWidth={1.5}
      />
      <h2 className="text-lg font-semibold text-[#333] mb-2">
        Failed to load reconciliation data
      </h2>
      <p className="text-sm text-[#888] mb-6 max-w-md mx-auto">
        {error.message || "An unexpected error occurred while loading the revenue reconciliation view."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg border border-[#e6e6e6] bg-white px-4 py-2 text-sm font-medium text-[#333] hover:border-[#ccc] transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
