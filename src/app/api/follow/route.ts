export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// POST /api/follow { targetId } — toggle follow/unfollow
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { targetId } = await request.json();
  if (!targetId) return Response.json({ error: "targetId required" }, { status: 400 });
  if (targetId === user.id) return Response.json({ error: "Cannot follow yourself" }, { status: 400 });

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: user.id, followingId: targetId } },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
    return Response.json({ following: false });
  }

  await prisma.follow.create({
    data: { followerId: user.id, followingId: targetId },
  });

  return Response.json({ following: true });
}

// GET /api/follow?targetId=xxx — check if following
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return Response.json({ following: false });

  const { searchParams } = new URL(request.url);
  const targetId = searchParams.get("targetId");
  if (!targetId) return Response.json({ following: false });

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: user.id, followingId: targetId } },
  });

  return Response.json({ following: !!existing });
}
