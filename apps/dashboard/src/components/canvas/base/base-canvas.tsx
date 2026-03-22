"use client";

import { cn } from "@vendcfo/ui/cn";

export function BaseCanvas({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "fixed z-30 scrollbar-hide overflow-y-auto",
        "bg-white border border-[#e6e6e6]",
        "overflow-x-hidden transition-transform duration-300 ease-in-out",
        "translate-x-0",
        "top-[88px] bottom-0 left-0 right-0",
        "md:inset-x-auto md:right-4 md:w-[579px] md:bottom-auto",
      )}
      style={{ height: "calc(100vh - 88px)" }}
    >
      <div className="h-full flex flex-col relative">{children}</div>
    </div>
  );
}
