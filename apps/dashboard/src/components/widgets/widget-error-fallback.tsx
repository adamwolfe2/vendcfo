"use client";

export function WidgetErrorFallback() {
  return (
    <div className="h-full flex items-center justify-center text-xs text-[#707070] border border-[#e6e6e6] rounded">
      This widget could not load. Try refreshing the page.
    </div>
  );
}
