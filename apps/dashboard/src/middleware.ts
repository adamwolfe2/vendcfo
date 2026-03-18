import { createI18nMiddleware } from "next-international/middleware";
import { type NextRequest, NextResponse } from "next/server";

const I18nMiddleware = createI18nMiddleware({
  locales: ["en"],
  defaultLocale: "en",
  urlMappingStrategy: "rewrite",
});

export async function middleware(request: NextRequest) {
  const i18nResponse = I18nMiddleware(request);

  // In mock/demo mode OR when Supabase isn't configured, skip auth entirely
  if (
    process.env.NEXT_PUBLIC_MOCK_UI === 'true' ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return i18nResponse;
  }

  // Only import Supabase when env vars are confirmed present
  try {
    const { updateSession } = await import("@vendcfo/supabase/middleware");
    const { createClient } = await import("@vendcfo/supabase/server");

    // @ts-ignore-error - NextRequest type compatibility
    const response = await updateSession(request, i18nResponse);
    const supabase = await createClient();
    const url = new URL("/", request.url);
    const nextUrl = request.nextUrl;

    // Use the original request pathname (before i18n rewrite)
    // With rewrite strategy + single locale, nextUrl.pathname may have /en/ prefix
    const pathname = request.nextUrl.pathname;

    // Check if this is a public route that doesn't need auth
    const isPublicRoute =
      pathname === "/login" ||
      pathname === "/en/login" ||
      pathname.includes("/i/") ||
      pathname.includes("/p/") ||
      pathname.includes("/s/") ||
      pathname.includes("/r/") ||
      pathname.includes("/verify") ||
      pathname.includes("/oauth-callback") ||
      pathname.includes("/desktop/search");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Not authenticated — redirect to login (unless already on a public route)
    if (!user && !isPublicRoute) {
      const loginUrl = new URL("/login", request.url);

      // Only add return_to if it's a real path (not login itself)
      const cleanPath = pathname.replace(/^\/en/, "") || "/";
      if (cleanPath !== "/" && cleanPath !== "/login") {
        loginUrl.searchParams.append("return_to", cleanPath.substring(1));
      }

      return NextResponse.redirect(loginUrl);
    }

    // If authenticated, proceed with other checks
    if (user) {
      if (!pathname.includes("/teams/create") && !pathname.includes("/teams")) {
        // Check if the URL contains an invite code
        const inviteCodeMatch = pathname.includes("/teams/invite/");

        if (inviteCodeMatch) {
          return NextResponse.redirect(
            `${url.origin}${request.nextUrl.pathname}`,
          );
        }
      }

      // 3. Check MFA Verification
      const { data: mfaData } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (
        mfaData &&
        mfaData.nextLevel === "aal2" &&
        mfaData.nextLevel !== mfaData.currentLevel &&
        !pathname.includes("/mfa/verify")
      ) {
        const mfaUrl = new URL("/mfa/verify", request.url);
        return NextResponse.redirect(mfaUrl);
      }
    }

    return response;
  } catch (e) {
    // If Supabase fails for any reason, fall through to i18n-only response
    console.error("[middleware] Supabase auth failed, bypassing:", e);
    return i18nResponse;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
