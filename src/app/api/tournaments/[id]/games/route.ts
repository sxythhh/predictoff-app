export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// GET /api/tournaments/[id]/games — curated game list
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const games = await prisma.tournamentGame.findMany({
    where: { tournamentId: id },
    orderBy: { startsAt: "asc" },
    include: {
      _count: { select: { picks: true } },
    },
  });

  return Response.json({
    games: games.map((g) => ({
      id: g.id,
      gameId: g.gameId,
      gameTitle: g.gameTitle,
      sportName: g.sportName,
      leagueName: g.leagueName,
      startsAt: g.startsAt,
      resolved: g.resolved,
      totalPicks: g._count.picks,
      metadata: g.metadata,
    })),
  });
}

// POST /api/tournaments/[id]/games — add games (creator only, before active)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const tournament = await prisma.tournament.findUnique({ where: { id } });
  if (!tournament) return Response.json({ error: "Not found" }, { status: 404 });
  if (tournament.creatorId !== user.id) return Response.json({ error: "Forbidden" }, { status: 403 });
  if (!["draft", "open"].includes(tournament.status)) {
    return Response.json({ error: "Can only add games before tournament starts" }, { status: 400 });
  }

  const body = await request.json();
  const games: Array<{ gameId: string; gameTitle?: string; sportName?: string; leagueName?: string; startsAt?: number }> = body.games;

  if (!Array.isArray(games) || games.length === 0) {
    return Response.json({ error: "games array required" }, { status: 400 });
  }

  const results = [];
  for (const g of games) {
    if (!g.gameId) continue;
    try {
      const created = await prisma.tournamentGame.upsert({
        where: { tournamentId_gameId: { tournamentId: id, gameId: g.gameId } },
        create: {
          tournamentId: id,
          gameId: g.gameId,
          gameTitle: g.gameTitle ?? null,
          sportName: g.sportName ?? null,
          leagueName: g.leagueName ?? null,
          startsAt: g.startsAt ?? 0,
        },
        update: {
          gameTitle: g.gameTitle ?? undefined,
          sportName: g.sportName ?? undefined,
          leagueName: g.leagueName ?? undefined,
        },
      });
      results.push(created);
    } catch { /* duplicate — skip */ }
  }

  // Update tournament scope + allowedGameIds
  const allGames = await prisma.tournamentGame.findMany({
    where: { tournamentId: id },
    select: { gameId: true },
  });
  await prisma.tournament.update({
    where: { id },
    data: {
      scope: "curated",
      allowedGameIds: allGames.map((g) => g.gameId),
    },
  });

  return Response.json({ added: results.length }, { status: 201 });
}

// DELETE /api/tournaments/[id]/games — remove a game
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const tournament = await prisma.tournament.findUnique({ where: { id } });
  if (!tournament) return Response.json({ error: "Not found" }, { status: 404 });
  if (tournament.creatorId !== user.id) return Response.json({ error: "Forbidden" }, { status: 403 });
  if (!["draft", "open"].includes(tournament.status)) {
    return Response.json({ error: "Can only remove games before tournament starts" }, { status: 400 });
  }

  const body = await request.json();
  const { gameId } = body;
  if (!gameId) return Response.json({ error: "gameId required" }, { status: 400 });

  await prisma.tournamentGame.deleteMany({
    where: { tournamentId: id, gameId },
  });

  // Update allowedGameIds
  const remaining = await prisma.tournamentGame.findMany({
    where: { tournamentId: id },
    select: { gameId: true },
  });
  await prisma.tournament.update({
    where: { id },
    data: { allowedGameIds: remaining.map((g) => g.gameId) },
  });

  return Response.json({ removed: true });
}
