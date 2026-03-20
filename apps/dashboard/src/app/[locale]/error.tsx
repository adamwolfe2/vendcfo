"use client";

import { CopyInput } from "@/components/copy-input";
import { SUPPORT_EMAIL } from "@/utils/constants";
import { Button } from "@vendcfo/ui/button";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      import("@sentry/nextjs").then((Sentry) => {
        Sentry.captureException(error);
      });
    }
  }, [error]);

  return (
    <div className="h-[calc(100vh-200px)] w-full flex items-center justify-center">
      <div className="max-w-md w-full text-center px-4">
        <h2 className="font-medium mb-4">This page could not be loaded</h2>
        <p className="text-sm text-[#878787] mb-6">
          A server error prevented the page from rendering. This is usually temporary.
          <br />
          Try again, or contact support if the problem continues.
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
