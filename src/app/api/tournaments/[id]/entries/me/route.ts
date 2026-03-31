export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// GET /api/tournaments/[id]/entries/me — current user's entry + picks
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const entry = await prisma.tournamentEntry.findUnique({
    where: { tournamentId_userId: { tournamentId: id, userId: user.id } },
    include: {
      picks: {
        include: {
          tournamentGame: { select: { gameId: true, gameTitle: true, startsAt: true, resolved: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      betSnapshots: {
        orderBy: { betCreatedAt: "desc" },
        take: 50,
      },
    },
  });

  if (!entry) return Response.json({ entry: null });

  return Response.json({
    entry: {
      id: entry.id,
      score: entry.score,
      rank: entry.rank,
      totalStaked: entry.totalStaked,
      totalPayout: entry.totalPayout,
      correctPicks: entry.correctPicks,
      totalPicks: entry.totalPicks,
      prizeAmount: entry.prizeAmount,
      picks: entry.picks.map((p) => ({
        id: p.id,
        conditionId: p.conditionId,
        outcomeId: p.outcomeId,
        marketName: p.marketName,
        selectionName: p.selectionName,
        isCorrect: p.isCorrect,
        pointsAwarded: p.pointsAwarded,
        game: p.tournamentGame,
      })),
      betSnapshots: entry.betSnapshots.map((s) => ({
        tokenId: s.tokenId,
        gameId: s.gameId,
        amount: s.amount,
        possibleWin: s.possibleWin,
        odds: s.odds,
        isWin: s.isWin,
        isLose: s.isLose,
        payout: s.payout,
        outcomes: s.outcomes,
      })),
    },
  });
}
