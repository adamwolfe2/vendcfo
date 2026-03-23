import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (
    !process.env.STRIPE_SECRET_KEY ||
    !process.env.STRIPE_CONNECT_CLIENT_ID
  ) {
    return NextResponse.json(
      {
        error:
          "Stripe Payments integration is not yet configured. Stripe Connect credentials are required. Contact support for setup details.",
      },
      { status: 501 },
    );
  }

  // TODO: Implement Stripe Connect OAuth flow once credentials are configured
  return NextResponse.json(
    { error: "Stripe Connect OAuth flow not yet implemented" },
    { status: 501 },
  );
}
