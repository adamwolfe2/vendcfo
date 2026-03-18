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

    const pathnameLocale = nextUrl.pathname.split("/", 2)?.[1];

    // Remove the locale from the pathname
    const pathnameWithoutLocale = pathnameLocale
      ? nextUrl.pathname.slice(pathnameLocale.length + 1)
      : nextUrl.pathname;

    // Create a new URL without the locale in the pathname
    const newUrl = new URL(pathnameWithoutLocale || "/", request.url);

    const encodedSearchParams = `${newUrl?.pathname?.substring(1)}${
      newUrl.search
    }`;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    // 1. Not authenticated
    if (
      !session &&
      newUrl.pathname !== "/login" &&
      !newUrl.pathname.includes("/i/") &&
      !newUrl.pathname.includes("/p/") &&
      !newUrl.pathname.includes("/s/") &&
      !newUrl.pathname.includes("/r/") &&
      !newUrl.pathname.includes("/verify") &&
      !newUrl.pathname.includes("/oauth-callback") &&
      !newUrl.pathname.includes("/desktop/search")
    ) {
      const url = new URL("/login", request.url);

      if (encodedSearchParams) {
        url.searchParams.append("return_to", encodedSearchParams);
      }

      return NextResponse.redirect(url);
    }

    // If authenticated, proceed with other checks
    if (session) {
      if (newUrl.pathname !== "/teams/create" && newUrl.pathname !== "/teams") {
        // Check if the URL contains an invite code
        const inviteCodeMatch = newUrl.pathname.startsWith("/teams/invite/");

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
        newUrl.pathname !== "/mfa/verify"
      ) {
        const url = new URL("/mfa/verify", request.url);

        if (encodedSearchParams) {
          url.searchParams.append("return_to", encodedSearchParams);
        }

        return NextResponse.redirect(url);
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
