export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// GET /api/tournaments/[id]/picks — get current user's picks
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const entry = await prisma.tournamentEntry.findUnique({
    where: { tournamentId_userId: { tournamentId: id, userId: user.id } },
  });
  if (!entry) return Response.json({ error: "Not joined" }, { status: 404 });

  const picks = await prisma.tournamentPick.findMany({
    where: { entryId: entry.id },
    include: {
      tournamentGame: { select: { gameId: true, gameTitle: true, startsAt: true, resolved: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return Response.json({
    picks: picks.map((p) => ({
      id: p.id,
      tournamentGameId: p.tournamentGameId,
      conditionId: p.conditionId,
      outcomeId: p.outcomeId,
      marketName: p.marketName,
      selectionName: p.selectionName,
      isCorrect: p.isCorrect,
      pointsAwarded: p.pointsAwarded,
      game: p.tournamentGame,
    })),
  });
}

// POST /api/tournaments/[id]/picks — submit/update picks (batch upsert)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const tournament = await prisma.tournament.findUnique({ where: { id } });
  if (!tournament) return Response.json({ error: "Not found" }, { status: 404 });
  if (!["open", "active"].includes(tournament.status)) {
    return Response.json({ error: "Tournament is not accepting picks" }, { status: 400 });
  }

  const entry = await prisma.tournamentEntry.findUnique({
    where: { tournamentId_userId: { tournamentId: id, userId: user.id } },
  });
  if (!entry) return Response.json({ error: "Not joined" }, { status: 404 });

  const body = await request.json();
  const picks: Array<{
    tournamentGameId: string;
    conditionId: string;
    outcomeId: string;
    marketName?: string;
    selectionName?: string;
  }> = body.picks;

  if (!Array.isArray(picks) || picks.length === 0) {
    return Response.json({ error: "picks array required" }, { status: 400 });
  }

  const now = Math.floor(Date.now() / 1000);

  // Validate each pick and upsert
  const results = [];
  for (const pick of picks) {
    // Verify game exists and belongs to this tournament
    const game = await prisma.tournamentGame.findUnique({
      where: { id: pick.tournamentGameId },
    });
    if (!game || game.tournamentId !== id) continue;

    // Can't pick after game starts
    if (now >= game.startsAt) continue;

    const upserted = await prisma.tournamentPick.upsert({
      where: {
        entryId_tournamentGameId_conditionId: {
          entryId: entry.id,
          tournamentGameId: pick.tournamentGameId,
          conditionId: pick.conditionId,
        },
      },
      create: {
        entryId: entry.id,
        tournamentId: id,
        tournamentGameId: pick.tournamentGameId,
        conditionId: pick.conditionId,
        outcomeId: pick.outcomeId,
        marketName: pick.marketName ?? null,
        selectionName: pick.selectionName ?? null,
      },
      update: {
        outcomeId: pick.outcomeId,
        selectionName: pick.selectionName ?? null,
      },
    });
    results.push(upserted);
  }

  return Response.json({
    saved: results.length,
    picks: results.map((p) => ({
      id: p.id,
      tournamentGameId: p.tournamentGameId,
      conditionId: p.conditionId,
      outcomeId: p.outcomeId,
      selectionName: p.selectionName,
    })),
  });
}
