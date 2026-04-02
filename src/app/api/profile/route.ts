export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
const RESERVED_USERNAMES = new Set([
  "admin", "api", "app", "auth", "dashboard", "discover", "game",
  "help", "home", "login", "logout", "picks", "profile", "search",
  "settings", "signup", "support", "team", "tipster", "tipsters",
  "tournaments", "user", "waliet", "wallet", "stocked",
]);

function validateUsername(raw: string): { valid: boolean; error?: string; username?: string } {
  const username = raw.trim().toLowerCase();
  if (!USERNAME_RE.test(username)) {
    return { valid: false, error: "Username must be 3–20 characters: lowercase letters, numbers, and underscores only" };
  }
  if (RESERVED_USERNAMES.has(username)) {
    return { valid: false, error: "That username is reserved" };
  }
  return { valid: true, username };
}

// GET /api/profile — get current user's profile
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Response.json({
    id: user.id,
    walletAddress: user.walletAddress,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    banner: user.banner,
    bio: user.bio,
    profileVisibility: user.profileVisibility,
    showBetHistory: user.showBetHistory,
    showStats: user.showStats,
    createdAt: user.createdAt.toISOString(),
  });
}

// PATCH /api/profile { displayName?, username?, avatar?, bio? }
export async function PATCH(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const updates: Record<string, any> = {};

  // Username
  if (typeof body.username === "string" && body.username.trim() !== "") {
    const result = validateUsername(body.username);
    if (!result.valid) {
      return Response.json({ error: result.error }, { status: 400 });
    }
    // Check uniqueness (skip if it's the user's current username)
    if (result.username !== user.username) {
      const existing = await prisma.user.findUnique({ where: { username: result.username! } });
      if (existing) {
        return Response.json({ error: "Username already taken" }, { status: 409 });
      }
      updates.username = result.username;
    }
  } else if (body.username === null) {
    updates.username = null;
  }

  if (typeof body.displayName === "string") {
    const name = body.displayName.trim().slice(0, 50);
    updates.displayName = name || "";
  }
  if (typeof body.bio === "string") {
    updates.bio = body.bio.trim().slice(0, 300);
  }
  if (typeof body.avatar === "string") {
    updates.avatar = body.avatar.trim().slice(0, 500);
  }
  if (typeof body.banner === "string" || body.banner === null) {
    updates.banner = body.banner ? body.banner.trim().slice(0, 500) : "";
  }
  if (typeof body.profileVisibility === "string" && ["public", "private"].includes(body.profileVisibility)) {
    updates.profileVisibility = body.profileVisibility;
  }
  if (typeof body.showBetHistory === "boolean") {
    updates.showBetHistory = body.showBetHistory;
  }
  if (typeof body.showStats === "boolean") {
    updates.showStats = body.showStats;
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: updates,
  });

  return Response.json({
    id: updated.id,
    walletAddress: updated.walletAddress,
    username: updated.username,
    displayName: updated.displayName,
    avatar: updated.avatar,
    bio: updated.bio,
  });
}
