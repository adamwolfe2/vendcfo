"use client";

import { unenrollMfaAction } from "@/actions/unenroll-mfa-action";
import { Button } from "@vendcfo/ui/button";
import { useToast } from "@vendcfo/ui/use-toast";
import { useAction } from "next-safe-action/hooks";

type Props = {
  factorId: string;
};

export function RemoveMFAButton({ factorId }: Props) {
  const { toast } = useToast();

  const unenroll = useAction(unenrollMfaAction, {
    onError: () => {
      toast({
        duration: 3500,
        variant: "error",
        title: "Could not remove MFA. Please try again.",
      });
    },
  });

  return (
    <Button variant="outline" onClick={() => unenroll.execute({ factorId })}>
      Remove
    </Button>
  );
}
