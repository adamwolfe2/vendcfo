import { NextResponse } from "next/server";

export async function GET() {
  const response = NextResponse.redirect(
    new URL("/", process.env.NEXT_PUBLIC_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3001"),
  );

  // Set a demo mode cookie that the middleware will check
  response.cookies.set("vendcfo-demo", "true", {
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
    httpOnly: true,
    sameSite: "lax",
  });

  return response;
}
