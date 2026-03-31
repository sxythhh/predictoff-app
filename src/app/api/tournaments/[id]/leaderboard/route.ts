export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/tournaments/[id]/leaderboard?limit=50&cursor=xxx
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
  const cursor = searchParams.get("cursor");

  const entries = await prisma.tournamentEntry.findMany({
    where: { tournamentId: id },
    orderBy: [{ score: "desc" }, { joinedAt: "asc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      user: { select: { id: true, walletAddress: true, displayName: true, avatar: true } },
    },
  });

  const hasMore = entries.length > limit;
  const items = hasMore ? entries.slice(0, limit) : entries;

  return Response.json({
    entries: items.map((e, i) => ({
      id: e.id,
      rank: e.rank ?? i + 1,
      score: e.score,
      totalStaked: e.totalStaked,
      totalPayout: e.totalPayout,
      correctPicks: e.correctPicks,
      totalPicks: e.totalPicks,
      prizeAmount: e.prizeAmount,
      user: e.user,
      joinedAt: e.joinedAt.toISOString(),
    })),
    nextCursor: hasMore ? items[items.length - 1].id : null,
  });
}
