export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

const VALID_TYPES = ["bet_placed", "bet_won", "bet_lost", "comment", "follow", "tournament_created", "tournament_joined", "tournament_won"];

// GET /api/activity?userId=xxx&limit=20&cursor=xxx
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
  const cursor = searchParams.get("cursor");

  if (!userId) {
    return Response.json({ error: "userId required" }, { status: 400 });
  }

  // Check privacy — if not the owner, check profileVisibility
  const authUser = await getAuthUser(request);
  if (authUser?.id !== userId) {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { profileVisibility: true },
    });
    if (!targetUser || targetUser.profileVisibility === "private") {
      return Response.json({ activities: [], nextCursor: null });
    }
  }

  const activities = await prisma.activity.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      user: { select: { id: true, walletAddress: true, displayName: true, avatar: true } },
    },
  });

  const hasMore = activities.length > limit;
  const items = hasMore ? activities.slice(0, limit) : activities;

  return Response.json({
    activities: items.map((a) => ({
      id: a.id,
      type: a.type,
      metadata: a.metadata,
      createdAt: a.createdAt.toISOString(),
      user: a.user,
    })),
    nextCursor: hasMore ? items[items.length - 1].id : null,
  });
}

// POST /api/activity { type, metadata }
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { type, metadata } = body;

  if (!type || !VALID_TYPES.includes(type)) {
    return Response.json({ error: "Invalid activity type" }, { status: 400 });
  }

  // Rate limit: max 1 activity per second
  const recent = await prisma.activity.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  if (recent && Date.now() - recent.createdAt.getTime() < 1000) {
    return Response.json({ error: "Too fast" }, { status: 429 });
  }

  const activity = await prisma.activity.create({
    data: {
      userId: user.id,
      type,
      metadata: metadata ?? {},
    },
  });

  return Response.json({
    id: activity.id,
    type: activity.type,
    metadata: activity.metadata,
    createdAt: activity.createdAt.toISOString(),
  });
}

// PATCH /api/activity { id, type } — update activity type (e.g. bet_placed → bet_won)
export async function PATCH(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, type } = body;

  if (!id || !type || !VALID_TYPES.includes(type)) {
    return Response.json({ error: "Invalid params" }, { status: 400 });
  }

  const activity = await prisma.activity.findUnique({ where: { id } });
  if (!activity || activity.userId !== user.id) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.activity.update({
    where: { id },
    data: { type },
  });

  return Response.json({ id: updated.id, type: updated.type });
}
