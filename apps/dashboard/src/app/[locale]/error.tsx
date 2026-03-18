"use client";

import { CopyInput } from "@/components/copy-input";
import { SUPPORT_EMAIL } from "@/utils/constants";
import { Button } from "@vendcfo/ui/button";
import { useEffect } from "react";

function isDemoMode(): boolean {
  if (process.env.NEXT_PUBLIC_MOCK_UI === "true") return true;
  if (typeof window !== "undefined" && (window as any).__VENDCFO_DEMO__) return true;
  return false;
}

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && !isDemoMode()) {
      import("@sentry/nextjs").then((Sentry) => {
        Sentry.captureException(error);
      });
    }
  }, [error]);

  if (isDemoMode()) {
    return (
      <div className="h-[calc(100vh-200px)] w-full flex items-center justify-center">
        <div className="max-w-md w-full text-center px-4">
          <h2 className="font-medium mb-4">Demo Mode</h2>
          <p className="text-sm text-[#878787] mb-6">
            This page requires a backend connection to display data.
            <br />
            The UI chrome (sidebar, header, navigation) is fully functional.
          </p>
          <Button onClick={() => reset()} variant="outline" className="mt-6">
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-200px)] w-full flex items-center justify-center">
      <div className="max-w-md w-full text-center px-4">
        <h2 className="font-medium mb-4">Something went wrong</h2>
        <p className="text-sm text-[#878787] mb-6">
          We've been notified and are looking into it.
          <br />
          If this issue persists, please reach out to our support team.
        </p>

        <CopyInput value={SUPPORT_EMAIL} />

        {error.digest && (
          <p className="text-xs text-[#4a4a4a] mt-4">
            Error ID: {error.digest}
          </p>
        )}

        <Button onClick={() => reset()} variant="outline" className="mt-6">
          Try again
        </Button>
      </div>
    </div>
  );
}
