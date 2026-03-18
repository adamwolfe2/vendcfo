"use client";

import { Button } from "@vendcfo/ui/button";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

export default function SidebarErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isMockMode = process.env.NEXT_PUBLIC_MOCK_UI === "true";

  return (
    <div className="h-[calc(100vh-200px)] w-full flex items-center justify-center">
      <div className="max-w-md w-full text-center px-4">
        {isMockMode ? (
          <>
            <h2 className="font-medium mb-4">Demo Mode</h2>
            <p className="text-sm text-[#878787] mb-6">
              This page requires a backend API connection to display data.
              <br />
              The UI chrome (sidebar, header, navigation) is fully functional.
            </p>
          </>
        ) : (
          <>
            <h2 className="font-medium mb-4">Something went wrong</h2>
            <p className="text-sm text-[#878787] mb-6">
              Could not load page data. Please try again.
            </p>
          </>
        )}

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
