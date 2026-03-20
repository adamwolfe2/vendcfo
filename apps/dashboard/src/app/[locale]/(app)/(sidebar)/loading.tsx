import { Icons } from "@vendcfo/ui/icons";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white">
      {/* Spinning logo */}
      <div className="animate-spin-slow mb-8">
        <Icons.LogoSmall className="w-12 h-12 text-foreground" />
      </div>

      {/* Progress bar */}
      <div className="w-48 h-1 bg-[#f0f0f0] rounded-full overflow-hidden">
        <div className="h-full bg-foreground rounded-full animate-progress" />
      </div>

      {/* Brand text */}
      <p className="mt-4 text-sm text-[#878787] animate-pulse">
        Loading your dashboard...
      </p>
    </div>
  );
}
