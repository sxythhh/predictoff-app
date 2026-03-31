export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/tipsters/[id]/stats
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, isTipster: true, displayName: true, avatar: true, tipsterBio: true, subscriptionPrice: true },
  });

  if (!user || !user.isTipster) return Response.json({ error: "Tipster not found" }, { status: 404 });

  const [totalPicks, resolvedPicks, wins, subscriberCount, recentPicks] = await Promise.all([
    prisma.tipsterPick.count({ where: { tipsterId: id } }),
    prisma.tipsterPick.count({ where: { tipsterId: id, isResolved: true } }),
    prisma.tipsterPick.count({ where: { tipsterId: id, isResolved: true, isCorrect: true } }),
    prisma.tipsterSubscription.count({ where: { tipsterId: id, status: "active" } }),
    prisma.tipsterPick.findMany({
      where: { tipsterId: id, isResolved: true },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { isCorrect: true },
    }),
  ]);

  const winRate = resolvedPicks > 0 ? Math.round((wins / resolvedPicks) * 100) : 0;
  const form = recentPicks.map((p) => p.isCorrect ? "W" : "L");

  // Calculate current streak
  let streak = 0;
  let streakType: "W" | "L" | null = null;
  for (const p of recentPicks) {
    const result = p.isCorrect ? "W" : "L";
    if (streakType === null) { streakType = result; streak = 1; }
    else if (result === streakType) streak++;
    else break;
  }

  return Response.json({
    tipster: user,
    stats: {
      totalPicks,
      resolvedPicks,
      wins,
      losses: resolvedPicks - wins,
      winRate,
      subscriberCount,
      form,
      streak: streakType ? { type: streakType, count: streak } : null,
    },
  });
}
