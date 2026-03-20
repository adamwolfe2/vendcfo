import { Cookies } from "@/utils/constants";
import { db } from "@vendcfo/db/client";
import { ensureUserExists } from "@vendcfo/db/queries";
import { LogEvents } from "@vendcfo/events/events";
import { setupAnalytics } from "@vendcfo/events/server";
import { getSession } from "@vendcfo/supabase/cached-queries";
import { createClient } from "@vendcfo/supabase/server";
import { addSeconds, addYears } from "date-fns";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const client = requestUrl.searchParams.get("client");
  const returnTo = requestUrl.searchParams.get("return_to");
  const provider = requestUrl.searchParams.get("provider");

  if (client === "desktop") {
    return NextResponse.redirect(`${requestUrl.origin}/verify?code=${code}`);
  }

  if (provider) {
    cookieStore.set(Cookies.PreferredSignInProvider, provider, {
      expires: addYears(new Date(), 1),
    });
  }

  if (code) {
    try {
      const supabase = await createClient();
      await supabase.auth.exchangeCodeForSession(code);

      const {
        data: { session },
      } = await getSession();

      if (session) {
        const userId = session.user.id;

        // Ensure public.users record exists (safe to call on every login)
        await ensureUserExists(db, {
          id: userId,
          email: session.user.email!,
          fullName: session.user.user_metadata?.full_name ?? null,
        });

        // Set cookie to force primary database reads for new users (10 seconds)
        // This prevents replication lag issues when user record hasn't replicated yet
        cookieStore.set(Cookies.ForcePrimary, "true", {
          expires: addSeconds(new Date(), 10),
          httpOnly: false, // Needs to be readable by client-side tRPC
          sameSite: "lax",
        });

        const analytics = await setupAnalytics();

        await analytics.track({
          event: LogEvents.SignIn.name,
          channel: LogEvents.SignIn.channel,
        });

        // If user is redirected from an invite, redirect to teams page to accept/decline the invite
        if (returnTo?.startsWith("teams/invite/")) {
          return NextResponse.redirect(`${requestUrl.origin}/teams`);
        }

        // If user have no teams, redirect to team creation
        const { count } = await supabase
          .from("users_on_team")
          .select("*", { count: "exact" })
          .eq("user_id", userId);

        if (count === 0 && !returnTo?.startsWith("teams/invite/")) {
          return NextResponse.redirect(`${requestUrl.origin}/teams/create`);
        }
      }
    } catch (error) {
      console.error("[auth/callback] Error:", error);
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=auth_failed`,
      );
    }
  }

  if (returnTo) {
    // Prevent open redirect: strip leading slashes, protocol-relative URLs, and
    // ensure the path doesn't contain protocol schemes
    const sanitized = returnTo
      .replace(/^[/\\]+/, "")
      .replace(/^https?:\/\//i, "")
      .replace(/^[a-z]+:/i, "");

    // Only allow simple relative paths (no backslashes, no protocol, no double dots escaping origin)
    if (
      sanitized &&
      !sanitized.includes("\\") &&
      !sanitized.includes("://") &&
      !sanitized.startsWith(".")
    ) {
      return NextResponse.redirect(`${requestUrl.origin}/${sanitized}`);
    }
  }

  return NextResponse.redirect(requestUrl.origin);
}
