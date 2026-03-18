import { type CookieOptions, createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

export async function updateSession(
  request: NextRequest,
  response: NextResponse,
) {
  // Log all Supabase-related cookies for debugging
  const sbCookies = Array.from(request.cookies.getAll())
    .filter((c) => c.name.startsWith("sb-"))
    .map((c) => `${c.name}=${c.value.substring(0, 20)}...`);
  console.log(`[updateSession] cookies found: ${sbCookies.length > 0 ? sbCookies.join(", ") : "NONE"}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.log(`[updateSession] getUser error: ${error.message}`);
  } else {
    console.log(`[updateSession] user: ${user?.id ?? "null"}, email: ${user?.email ?? "null"}`);
  }

  return { response, user };
}
