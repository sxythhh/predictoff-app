import { NextRequest, NextResponse } from "next/server";

/**
 * Magic OAuth callback — redirects back to the app with the magic credential
 * in the URL. The client-side code picks it up and completes auth.
 */
export async function GET(request: NextRequest) {
  // Magic appends query params with the OAuth result
  // Redirect to home page — the client-side Magic SDK will detect the params
  const url = new URL("/", request.nextUrl.origin);
  // Forward all query params from Magic's callback
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  return NextResponse.redirect(url);
}
