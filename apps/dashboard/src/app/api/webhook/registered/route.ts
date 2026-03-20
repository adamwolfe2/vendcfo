import * as crypto from "node:crypto";
import { tasks } from "@trigger.dev/sdk";
import { LogEvents } from "@vendcfo/events/events";
import { setupAnalytics } from "@vendcfo/events/server";
import type { OnboardTeamPayload } from "@vendcfo/jobs/schema";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// NOTE: This is trigger from supabase database webhook
export async function POST(req: Request) {
  const text = await req.clone().text();
  const signature = (await headers()).get("x-supabase-signature");

  if (!signature) {
    return NextResponse.json({ message: "Missing signature" }, { status: 401 });
  }

  const decodedSignature = Buffer.from(signature, "base64");

  const calculatedSignature = crypto
    .createHmac("sha256", process.env.WEBHOOK_SECRET_KEY!)
    .update(text)
    .digest();

  const hmacMatch = crypto.timingSafeEqual(
    decodedSignature,
    calculatedSignature,
  );

  if (!hmacMatch) {
    return NextResponse.json({ message: "Not Authorized" }, { status: 401 });
  }

  let body: { record?: { id?: string } };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const userId = body.record?.id;
  if (!userId) {
    return NextResponse.json({ message: "Missing user ID" }, { status: 400 });
  }

  const analytics = await setupAnalytics();

  analytics.track({
    event: LogEvents.Registered.name,
    channel: LogEvents.Registered.channel,
  });

  await tasks.trigger(
    "onboard-team",
    {
      userId,
    } satisfies OnboardTeamPayload,
    {
      delay: "10m",
    },
  );

  return NextResponse.json({ success: true });
}
