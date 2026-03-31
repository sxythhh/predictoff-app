export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/tipsters?sort=winRate|picks|newest&limit=20&cursor=xxx
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
  const cursor = searchParams.get("cursor");

  // Get all tipsters with pick stats
  const tipsters = await prisma.user.findMany({
    where: { isTipster: true },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      walletAddress: true,
      displayName: true,
      avatar: true,
      tipsterBio: true,
      subscriptionPrice: true,
      createdAt: true,
      _count: {
        select: {
          tipsterPicks: true,
          subscribers: { where: { status: "active" } },
          followers: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const hasMore = tipsters.length > limit;
  const items = hasMore ? tipsters.slice(0, limit) : tipsters;

  // Get win stats for each tipster
  const result = await Promise.all(items.map(async (t) => {
    const stats = await prisma.tipsterPick.aggregate({
      where: { tipsterId: t.id, isResolved: true },
      _count: true,
    });
    const wins = await prisma.tipsterPick.count({
      where: { tipsterId: t.id, isResolved: true, isCorrect: true },
    });
    const winRate = stats._count > 0 ? Math.round((wins / stats._count) * 100) : 0;

    return {
      id: t.id,
      walletAddress: t.walletAddress,
      displayName: t.displayName,
      avatar: t.avatar,
      tipsterBio: t.tipsterBio,
      subscriptionPrice: t.subscriptionPrice,
      totalPicks: t._count.tipsterPicks,
      subscriberCount: t._count.subscribers,
      followerCount: t._count.followers,
      resolvedPicks: stats._count,
      wins,
      winRate,
    };
  }));

  // Sort by win rate (desc), then by total picks
  result.sort((a, b) => b.winRate - a.winRate || b.totalPicks - a.totalPicks);

  return Response.json({
    tipsters: result,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  });
}
