"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { Icons } from "@vendcfo/ui/icons";
import { SubmitButton } from "@vendcfo/ui/submit-button";
import { useRouter } from "next/navigation";

export function ConnectOutlook() {
  const trpc = useTRPC();
  const router = useRouter();

  const connectMutation = useMutation(
    trpc.inboxAccounts.connect.mutationOptions({
      onSuccess: (authUrl) => {
        if (authUrl) {
          router.push(authUrl);
        }
      },
    }),
  );

  return (
    <SubmitButton
      className="px-6 py-4 w-full font-medium h-[40px]"
      variant="outline"
      onClick={() => connectMutation.mutate({ provider: "outlook" })}
      isSubmitting={connectMutation.isPending}
    >
      <div className="flex items-center space-x-2">
        <Icons.Outlook />
        <span>Connect Outlook</span>
      </div>
    </SubmitButton>
  );
}
