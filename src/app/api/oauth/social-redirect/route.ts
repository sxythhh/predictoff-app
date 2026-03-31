import { NextRequest } from "next/server";

/**
 * Server-side social auth redirect.
 *
 * The browser navigates here via GET. This endpoint:
 * 1. Fetches the CSRF token from NextAuth internally
 * 2. Returns an HTML page that auto-submits a form with the CSRF token
 * 3. The form POST goes to /api/oauth/signin/{provider} with the correct cookie
 *
 * This avoids the browser cookie mismatch between fetch() and form submission.
 */
export async function GET(request: NextRequest) {
  const provider = request.nextUrl.searchParams.get("provider");

  if (!provider || !["google", "twitter", "apple"].includes(provider)) {
    return Response.json({ error: "Invalid provider" }, { status: 400 });
  }

  const baseUrl = request.nextUrl.origin;

  // Fetch CSRF token from NextAuth — this runs server-side so no cookie issues
  const csrfRes = await fetch(`${baseUrl}/api/oauth/csrf`, {
    headers: { cookie: request.headers.get("cookie") ?? "" },
  });

  const setCookieHeaders = csrfRes.headers.getSetCookie?.() ?? [];
  const { csrfToken } = await csrfRes.json();

  // Return an HTML page that auto-submits the form
  const html = `<!DOCTYPE html>
<html>
<body>
  <form id="f" method="POST" action="/api/oauth/signin/${provider}">
    <input type="hidden" name="csrfToken" value="${csrfToken}" />
    <input type="hidden" name="callbackUrl" value="/" />
  </form>
  <script>document.getElementById('f').submit();</script>
</body>
</html>`;

  const response = new Response(html, {
    headers: { "Content-Type": "text/html" },
  });

  // Forward the Set-Cookie headers from the CSRF response so the browser has the cookie
  for (const cookie of setCookieHeaders) {
    response.headers.append("Set-Cookie", cookie);
  }

  return response;
}
