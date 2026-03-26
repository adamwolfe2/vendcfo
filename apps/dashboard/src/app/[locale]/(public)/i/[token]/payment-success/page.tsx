import { Icons } from "@vendcfo/ui/icons";
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

  return (
    <div className="min-h-screen dotted-bg flex items-center justify-center p-4">
      <div className="bg-background border border-border p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-3">
            <Icons.Check className="size-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <h1 className="text-2xl font-serif tracking-tight mb-2">
          Payment received
        </h1>
        <p className="text-sm text-[#606060] mb-8">
          Your payment has been processed successfully. You will receive a
          confirmation shortly.
        </p>

        <Link
          href={`/i/${params.token}`}
          className="inline-flex items-center justify-center h-10 px-6 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          View invoice
        </Link>

        <div className="mt-8">
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
