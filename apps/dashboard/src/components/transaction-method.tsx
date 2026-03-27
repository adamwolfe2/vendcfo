"use client";

import { useI18n } from "@/locales/client";
import type { RouterOutputs } from "@api/trpc/routers/_app";

type Props = {
  method: RouterOutputs["transactions"]["get"]["data"][number]["method"];
};

export function TransactionMethod({ method }: Props) {
  const t = useI18n();

  return (t as any)(`transaction_methods.${method}`);
}
