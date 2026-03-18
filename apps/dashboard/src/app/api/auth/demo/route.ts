import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL("/", request.url);
  const response = NextResponse.redirect(url);

  // Delete any old httpOnly version of the cookie
  response.cookies.delete("vendcfo-demo");

  // Set new non-httpOnly cookie so client JS can read it
  response.cookies.set("vendcfo-demo", "true", {
    path: "/",
    maxAge: 60 * 60 * 24,
    sameSite: "lax",
    httpOnly: false,
  });

  return response;
}
