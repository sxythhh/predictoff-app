export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// GET /api/picks?tipsterId=xxx&visibility=free&limit=20&cursor=xxx
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tipsterId = searchParams.get("tipsterId");
  const visibility = searchParams.get("visibility");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
  const cursor = searchParams.get("cursor");

  const where: Record<string, any> = {};
  if (tipsterId) where.tipsterId = tipsterId;
  if (visibility) where.visibility = visibility;

  const picks = await prisma.tipsterPick.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      tipster: { select: { id: true, walletAddress: true, displayName: true, avatar: true, isTipster: true, subscriptionPrice: true } },
    },
  });

  const hasMore = picks.length > limit;
  const items = hasMore ? picks.slice(0, limit) : picks;

  return Response.json({
    picks: items.map((p) => ({
      id: p.id,
      gameId: p.gameId,
      gameTitle: p.gameTitle,
      sportSlug: p.sportSlug,
      leagueName: p.leagueName,
      marketName: p.marketName,
      selectionName: p.selectionName,
      odds: p.odds,
      confidence: p.confidence,
      analysis: p.visibility === "premium" ? null : p.analysis, // Gate premium analysis
      startsAt: p.startsAt,
      visibility: p.visibility,
      isResolved: p.isResolved,
      isCorrect: p.isCorrect,
      createdAt: p.createdAt.toISOString(),
      tipster: p.tipster,
    })),
    nextCursor: hasMore ? items[items.length - 1].id : null,
  });
}

// POST /api/picks — create a new pick (tipsters only)
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.isTipster) return Response.json({ error: "Must be a tipster to post picks" }, { status: 403 });

  const body = await request.json();
  const { gameId, gameTitle, sportSlug, leagueName, conditionId, outcomeId, marketName, selectionName, odds, confidence, analysis, startsAt, visibility } = body;

  if (!gameId || !conditionId || !outcomeId || !selectionName || !odds) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Rate limit: max 10 picks per day
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentCount = await prisma.tipsterPick.count({
    where: { tipsterId: user.id, createdAt: { gte: dayAgo } },
  });
  if (recentCount >= 10) {
    return Response.json({ error: "Max 10 picks per day" }, { status: 429 });
  }

  const pick = await prisma.tipsterPick.create({
    data: {
      tipsterId: user.id,
      gameId,
      gameTitle: (gameTitle ?? "").slice(0, 200),
      sportSlug: sportSlug ?? null,
      leagueName: leagueName ?? null,
      conditionId,
      outcomeId,
      marketName: (marketName ?? "Market").slice(0, 100),
      selectionName: selectionName.slice(0, 100),
      odds: parseFloat(odds),
      confidence: ["high", "medium", "low"].includes(confidence) ? confidence : null,
      analysis: analysis?.trim()?.slice(0, 500) ?? null,
      startsAt: startsAt ?? Math.floor(Date.now() / 1000),
      visibility: visibility === "premium" ? "premium" : "free",
    },
    include: {
      tipster: { select: { id: true, displayName: true, avatar: true } },
    },
  });

  // Record activity
  prisma.activity.create({
    data: {
      userId: user.id,
      type: "pick_shared",
      metadata: { pickId: pick.id, gameTitle: pick.gameTitle, selectionName: pick.selectionName, odds: pick.odds },
    },
  }).catch(() => {});

  return Response.json({
    id: pick.id,
    gameTitle: pick.gameTitle,
    selectionName: pick.selectionName,
    odds: pick.odds,
    visibility: pick.visibility,
  }, { status: 201 });
}
