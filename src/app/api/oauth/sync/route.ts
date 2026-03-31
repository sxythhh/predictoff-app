export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/next-auth";
import { SESSION_COOKIE } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  const sessionToken = (session as any)?.sessionToken ??
    (session as any)?.user?.sessionToken;

  if (!sessionToken) {
    // Fallback: try reading from the JWT token directly
    // If no session token found, redirect home anyway
    return NextResponse.redirect(new URL("/", request.url));
  }

  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set(SESSION_COOKIE, sessionToken, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
