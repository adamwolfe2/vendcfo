import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook proxy.
 *
 * Forwards incoming Stripe webhook events to the API service which handles
 * signature verification and event processing. The raw body is forwarded
 * intact so that the API can verify the Stripe signature.
 *
 * For environments where Stripe is configured to send webhooks directly to
 * the API service, this route is not needed. It exists as a convenience
 * for local development or deployments where Stripe is pointed at the
 * dashboard URL.
 */
export async function POST(req: NextRequest) {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.VENDCFO_API_URL ||
    process.env.MIDDAY_API_URL;

  if (!apiUrl) {
    return NextResponse.json(
      { error: "API URL not configured" },
      { status: 500 },
    );
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 },
      );
    }

    const response = await fetch(`${apiUrl}/webhook/stripe`, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        "stripe-signature": signature,
      },
      body: rawBody,
    });

    const data = await response.json().catch(() => ({ received: true }));

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process webhook",
      },
      { status: 500 },
    );
  }
}
