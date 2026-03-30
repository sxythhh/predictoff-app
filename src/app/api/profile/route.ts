export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// GET /api/profile — get current user's profile
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Response.json({
    id: user.id,
    walletAddress: user.walletAddress,
    displayName: user.displayName,
    avatar: user.avatar,
    bio: user.bio,
    createdAt: user.createdAt.toISOString(),
  });
}

// PATCH /api/profile { displayName?, avatar?, bio? }
export async function PATCH(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const updates: Record<string, string> = {};

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

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: updates,
  });

  return Response.json({
    id: updated.id,
    walletAddress: updated.walletAddress,
    displayName: updated.displayName,
    avatar: updated.avatar,
    bio: updated.bio,
  });
}
