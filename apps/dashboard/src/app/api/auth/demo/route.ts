import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL("/", request.url);
  const response = NextResponse.redirect(url);

  response.cookies.set("vendcfo-demo", "true", {
    path: "/",
    maxAge: 60 * 60 * 24,
    httpOnly: true,
    sameSite: "lax",
  });

  return response;
}
