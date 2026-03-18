import { createI18nMiddleware } from "next-international/middleware";
import { type NextRequest, NextResponse } from "next/server";

const I18nMiddleware = createI18nMiddleware({
  locales: ["en"],
  defaultLocale: "en",
  urlMappingStrategy: "rewrite",
});

export async function middleware(request: NextRequest) {
  const i18nResponse = I18nMiddleware(request);

  // In mock/demo mode, demo cookie, or when Supabase isn't configured, skip auth
  if (
    process.env.NEXT_PUBLIC_MOCK_UI === 'true' ||
    request.cookies.get("vendcfo-demo")?.value === "true" ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return i18nResponse;
  }

  try {
    const { updateSession } = await import("@vendcfo/supabase/middleware");

    // updateSession refreshes the auth token, persists cookies,
    // and returns both the response and the authenticated user
    const { response, user } = await updateSession(request, i18nResponse);

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

    // Not authenticated — redirect to login (unless already on a public route)
    if (!user && !isPublicRoute) {
      const loginUrl = new URL("/login", request.url);

      const cleanPath = pathname.replace(/^\/en/, "") || "/";
      if (cleanPath !== "/" && cleanPath !== "/login") {
        loginUrl.searchParams.append("return_to", cleanPath.substring(1));
      }

      return NextResponse.redirect(loginUrl);
    }

    // If authenticated, check for team invites and MFA
    if (user) {
      const url = new URL("/", request.url);

      if (!pathname.includes("/teams/create") && !pathname.includes("/teams")) {
        if (pathname.includes("/teams/invite/")) {
          return NextResponse.redirect(
            `${url.origin}${request.nextUrl.pathname}`,
          );
        }
      }

      // Check MFA — need a fresh Supabase client for MFA check
      // but reuse the same cookie context from the response
      const { createServerClient } = await import("@supabase/ssr");
      const mfaSupabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value;
            },
            set() {},
            remove() {},
          },
        },
      );

      const { data: mfaData } =
        await mfaSupabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (
        mfaData &&
        mfaData.nextLevel === "aal2" &&
        mfaData.nextLevel !== mfaData.currentLevel &&
        !pathname.includes("/mfa/verify")
      ) {
        return NextResponse.redirect(new URL("/mfa/verify", request.url));
      }
    }

    return response;
  } catch (e) {
    console.error("[middleware] Supabase auth failed, bypassing:", e);
    return i18nResponse;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
