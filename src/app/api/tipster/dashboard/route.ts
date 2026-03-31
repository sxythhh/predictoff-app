export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// GET /api/tipster/dashboard — tipster's earnings + subscriber data
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.isTipster) return Response.json({ error: "Not a tipster" }, { status: 403 });

  const [
    activeSubscribers,
    totalSubscribers,
    totalPicks,
    resolvedPicks,
    wins,
    recentSubscribers,
    picksByMonth,
  ] = await Promise.all([
    prisma.tipsterSubscription.count({ where: { tipsterId: user.id, status: "active" } }),
    prisma.tipsterSubscription.count({ where: { tipsterId: user.id } }),
    prisma.tipsterPick.count({ where: { tipsterId: user.id } }),
    prisma.tipsterPick.count({ where: { tipsterId: user.id, isResolved: true } }),
    prisma.tipsterPick.count({ where: { tipsterId: user.id, isResolved: true, isCorrect: true } }),
    prisma.tipsterSubscription.findMany({
      where: { tipsterId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { subscriber: { select: { id: true, displayName: true, avatar: true, walletAddress: true } } },
    }),
    prisma.tipsterPick.groupBy({
      by: ["isCorrect"],
      where: { tipsterId: user.id, isResolved: true },
      _count: true,
    }),
  ]);

  const winRate = resolvedPicks > 0 ? Math.round((wins / resolvedPicks) * 100) : 0;
  const monthlyRevenue = activeSubscribers * (user.subscriptionPrice ?? 0);
  const platformFee = monthlyRevenue * 0.10;
  const netRevenue = monthlyRevenue - platformFee;

  return Response.json({
    stats: {
      activeSubscribers,
      totalSubscribers,
      totalPicks,
      resolvedPicks,
      wins,
      losses: resolvedPicks - wins,
      winRate,
      monthlyRevenue,
      platformFee,
      netRevenue,
      subscriptionPrice: user.subscriptionPrice,
    },
    recentSubscribers: recentSubscribers.map((s) => ({
      id: s.id,
      subscriber: s.subscriber,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
    })),
    whopBusinessId: user.whopBusinessId,
    whopConfigured: !!user.whopBusinessId,
  });
}
