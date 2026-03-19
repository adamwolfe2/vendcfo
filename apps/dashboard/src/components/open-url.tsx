"use client";

import { openUrl } from "@vendcfo/desktop-client/core";
import { isDesktopApp } from "@vendcfo/desktop-client/platform";
import { cn } from "@vendcfo/ui/cn";

export function OpenURL({
  href,
  children,
  className,
}: { href: string; children: React.ReactNode; className?: string }) {
  const handleOnClick = () => {
    if (isDesktopApp()) {
      openUrl(href);
    } else {
      window.open(href, "_blank");
    }
  };

  return (
    <span onClick={handleOnClick} className={cn("cursor-pointer", className)}>
      {children}
    </span>
  );
}
