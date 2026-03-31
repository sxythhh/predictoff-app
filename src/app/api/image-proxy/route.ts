import { NextRequest, NextResponse } from "next/server";

/**
 * Proxies external images to bypass CORS restrictions.
 * Used by useImageColor to extract dominant colors from team logos.
 *
 * GET /api/image-proxy?url=https://dev-avatars.azuro.org/...
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  try {
    const resp = await fetch(url, {
      headers: { "Accept": "image/*" },
    });

    if (!resp.ok) {
      return NextResponse.json({ error: "Upstream error" }, { status: resp.status });
    }

    const buffer = await resp.arrayBuffer();
    const contentType = resp.headers.get("content-type") ?? "image/png";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400, immutable",
        "Access-Control-Allow-Origin": "*",
        "CDN-Cache-Control": "public, max-age=2592000",
      },
    });
  } catch {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}
