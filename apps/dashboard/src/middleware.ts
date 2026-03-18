import { createI18nMiddleware } from "next-international/middleware";
import { type NextRequest, NextResponse } from "next/server";

const I18nMiddleware = createI18nMiddleware({
  locales: ["en"],
  defaultLocale: "en",
  urlMappingStrategy: "rewrite",
});

export async function middleware(request: NextRequest) {
  const i18nResponse = I18nMiddleware(request);
  const pathname = request.nextUrl.pathname;

  // Skip auth entirely if Supabase isn't configured
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    console.log("[middleware] Supabase not configured, skipping auth");
    return i18nResponse;
  }

  // Public routes that don't need auth
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

  try {
    const { updateSession } = await import("@vendcfo/supabase/middleware");

    const { response, user } = await updateSession(request, i18nResponse);

    console.log(`[middleware] path=${pathname} user=${user?.id ?? "null"} public=${isPublicRoute}`);

    // Not authenticated — redirect to login (unless already on a public route)
    if (!user && !isPublicRoute) {
      const loginUrl = new URL("/login", request.url);

      const cleanPath = pathname.replace(/^\/en/, "") || "/";
      if (cleanPath !== "/" && cleanPath !== "/login") {
        loginUrl.searchParams.append("return_to", cleanPath.substring(1));
      }

      console.log(`[middleware] redirecting to /login (no user)`);
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

      // MFA check
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
    console.error("[middleware] Supabase auth error:", e);
    return i18nResponse;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
