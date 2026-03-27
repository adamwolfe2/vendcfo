import { getQueryClient, trpc } from "@/trpc/server";
import { Icons } from "@vendcfo/ui/icons";
import { formatAmount } from "@vendcfo/utils/format";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Payment Received",
  robots: {
    index: false,
    follow: false,
  },
};

type Props = {
  params: Promise<{ token: string }>;
};

export default async function PaymentSuccessPage(props: Props) {
  const params = await props.params;
  const queryClient = getQueryClient();

  let invoice: {
    invoiceNumber?: string | null;
    amount?: number | null;
    currency?: string | null;
    team?: { name?: string | null } | null;
    customer?: { name?: string | null; portalId?: string | null; portalEnabled?: boolean | null } | null;
  } | null = null;

  try {
    invoice = await queryClient.fetchQuery(
      trpc.invoice.getInvoiceByToken.queryOptions({
        token: params.token,
      }),
    );
  } catch {
    // If we can't fetch invoice details, show the generic success page
  }

  const formattedAmount =
    invoice?.amount != null && invoice?.currency
      ? formatAmount({
          amount: invoice.amount,
          currency: invoice.currency,
        })
      : null;

  const portalLink =
    invoice?.customer?.portalEnabled && invoice?.customer?.portalId
      ? `/p/${invoice.customer.portalId}`
      : null;

  return (
    <div className="min-h-screen dotted-bg flex items-center justify-center p-4">
      <div className="bg-background border border-border p-6 sm:p-10 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-4">
            <Icons.Check className="size-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <h1 className="text-2xl font-serif tracking-tight mb-3">
          Payment received
        </h1>

        {formattedAmount && invoice?.invoiceNumber ? (
          <p className="text-sm text-[#606060] mb-2">
            Payment of{" "}
            <span className="font-medium text-foreground">
              {formattedAmount}
            </span>{" "}
            received for Invoice{" "}
            <span className="font-medium text-foreground">
              {invoice.invoiceNumber}
            </span>
          </p>
        ) : formattedAmount ? (
          <p className="text-sm text-[#606060] mb-2">
            Payment of{" "}
            <span className="font-medium text-foreground">
              {formattedAmount}
            </span>{" "}
            has been processed successfully.
          </p>
        ) : (
          <p className="text-sm text-[#606060] mb-2">
            Your payment has been processed successfully.
          </p>
        )}

        <p className="text-[13px] text-[#878787] mb-8">
          You will receive a confirmation shortly.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={`/i/${params.token}`}
            className="inline-flex items-center justify-center h-11 px-6 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors w-full sm:w-auto"
          >
            View invoice
          </Link>
          {portalLink && (
            <Link
              href={portalLink}
              className="inline-flex items-center justify-center h-11 px-6 text-sm font-medium border border-border bg-background hover:bg-muted/50 transition-colors w-full sm:w-auto"
            >
              Return to invoices
            </Link>
          )}
        </div>

        {invoice?.team?.name && (
          <p className="text-[12px] text-[#878787] mt-8">
            {invoice.team.name}
          </p>
        )}

        <div className="mt-4">
          <a
            href="https://vendcfo.vercel.app?utm_source=payment-success"
            target="_blank"
            rel="noreferrer"
            className="text-[9px] text-[#878787]"
          >
            Powered by <span className="text-primary">VendCFO</span>
          </a>
        </div>
      </div>
    </div>
  );
}
