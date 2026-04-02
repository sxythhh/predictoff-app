export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
const RESERVED_USERNAMES = new Set([
  "admin", "api", "app", "auth", "dashboard", "discover", "game",
  "help", "home", "login", "logout", "picks", "profile", "search",
  "settings", "signup", "support", "team", "tipster", "tipsters",
  "tournaments", "user", "waliet", "wallet", "stocked",
]);

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username")?.toLowerCase().trim();

  if (!username || !USERNAME_RE.test(username)) {
    return Response.json({ available: false, reason: "invalid" });
  }

  if (RESERVED_USERNAMES.has(username)) {
    return Response.json({ available: false, reason: "reserved" });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  return Response.json({ available: !existing });
}
