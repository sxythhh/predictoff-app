export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// GET /api/picks/feed?following=true&limit=20&cursor=xxx
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
  const cursor = searchParams.get("cursor");
  const following = searchParams.get("following") === "true";

  const user = following ? await getAuthUser(request) : null;

  let tipsterIds: string[] | undefined;
  if (following && user) {
    // Get followed tipsters (via TipsterSubscription)
    const subs = await prisma.tipsterSubscription.findMany({
      where: { subscriberId: user.id, status: "active" },
      select: { tipsterId: true },
    });
    tipsterIds = subs.map((s) => s.tipsterId);
    if (tipsterIds.length === 0) {
      return Response.json({ picks: [], nextCursor: null });
    }
  }

  const picks = await prisma.tipsterPick.findMany({
    where: {
      ...(tipsterIds ? { tipsterId: { in: tipsterIds } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      tipster: { select: { id: true, walletAddress: true, displayName: true, avatar: true, isTipster: true } },
    },
  });

  const hasMore = picks.length > limit;
  const items = hasMore ? picks.slice(0, limit) : picks;

  // Check which tipsters the user has access to
  const accessSet = new Set<string>();
  if (user) {
    accessSet.add(user.id); // Own picks always accessible
    const subs = await prisma.tipsterSubscription.findMany({
      where: { subscriberId: user.id, status: "active" },
      select: { tipsterId: true },
    });
    for (const s of subs) accessSet.add(s.tipsterId);
  }

  return Response.json({
    picks: items.map((p) => {
      const hasAccess = p.visibility === "free" || accessSet.has(p.tipsterId);
      return {
        id: p.id,
        gameId: p.gameId,
        gameTitle: p.gameTitle,
        sportSlug: p.sportSlug,
        leagueName: p.leagueName,
        marketName: p.marketName,
        selectionName: hasAccess ? p.selectionName : null,
        odds: hasAccess ? p.odds : null,
        confidence: hasAccess ? p.confidence : null,
        analysis: hasAccess ? p.analysis : null,
        startsAt: p.startsAt,
        visibility: p.visibility,
        isResolved: p.isResolved,
        isCorrect: p.isCorrect,
        createdAt: p.createdAt.toISOString(),
        tipster: p.tipster,
        hasAccess,
      };
    }),
    nextCursor: hasMore ? items[items.length - 1].id : null,
  });
}
