"use client";

import { Button } from "@vendcfo/ui/button";
import { useRouter } from "next/navigation";

export function ErrorFallback() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <div>
        <h2 className="text-md">This section failed to load</h2>
      </div>
      <Button onClick={() => router.refresh()} variant="outline">
        Try again
      </Button>
    </div>
  );
}
