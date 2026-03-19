"use client";

import { type OAuthProvider, useOAuthSignIn } from "@/hooks/use-oauth-sign-in";
import { cn } from "@vendcfo/ui/cn";
import { Icons } from "@vendcfo/ui/icons";
import { SubmitButton } from "@vendcfo/ui/submit-button";

type Props = {
  provider: OAuthProvider;
  showLastUsed?: boolean;
};

const iconMap = {
  Google: Icons.Google,
  Apple: Icons.Apple,
  Github: Icons.Github,
  Microsoft: Icons.Microsoft,
} as const;

export function OAuthSignIn({ provider, showLastUsed = false }: Props) {
  const { handleSignIn, isLoading, config } = useOAuthSignIn(provider);
  const Icon = iconMap[config.icon];

  const isPrimary = config.variant === "primary";

  return (
    <div className="relative w-full">
      <SubmitButton
        type="button"
        onClick={handleSignIn}
        isSubmitting={isLoading}
        className={cn(
          "w-full font-sans text-sm h-[40px] px-6 py-4 transition-colors disabled:opacity-50",
          isPrimary
            ? "bg-[#0e0e0e] border border-[#0e0e0e] text-white font-medium hover:bg-[#1a1a1a]"
            : "bg-transparent border border-[#0e0e0e] text-[#0e0e0e] hover:bg-[#0e0e0e]/5",
        )}
      >
        <div className="flex items-center justify-center gap-2">
          <Icon size={16} />
          <span>Continue with {config.name}</span>
        </div>
      </SubmitButton>
      {showLastUsed && !isLoading && (
        <div className="absolute top-[18px] right-3 -translate-y-1/2 pointer-events-none">
          <span className="font-sans text-[10px] text-muted-foreground">
            Last used
          </span>
        </div>
      )}
    </div>
  );
}
