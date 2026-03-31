export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/teams/[slug]?tab=upcoming|results|stats
export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { searchParams } = new URL(_request.url);
  const tab = searchParams.get("tab") ?? "upcoming";

  const team = await prisma.indexedTeam.findUnique({
    where: { slug },
    include: { sport: { select: { name: true, slug: true } } },
  });

  if (!team) return Response.json({ error: "Team not found" }, { status: 404 });

  const teamFilter = { OR: [{ homeTeamId: team.id }, { awayTeamId: team.id }] };

  if (tab === "upcoming") {
    const games = await prisma.indexedGame.findMany({
      where: { ...teamFilter, state: { in: ["prematch", "live"] } },
      orderBy: { startsAt: "asc" },
      take: 20,
      include: {
        homeTeam: { select: { id: true, name: true, slug: true, image: true } },
        awayTeam: { select: { id: true, name: true, slug: true, image: true } },
        league: { select: { name: true, slug: true, countryName: true, countrySlug: true } },
      },
    });

    return Response.json({
      team: { id: team.id, name: team.name, slug: team.slug, image: team.image, sport: team.sport },
      games: games.map((g) => ({
        id: g.id,
        azuroGameId: g.azuroGameId,
        title: g.title,
        startsAt: g.startsAt,
        state: g.state,
        homeTeam: g.homeTeam,
        awayTeam: g.awayTeam,
        league: g.league,
      })),
    });
  }

  if (tab === "results") {
    const games = await prisma.indexedGame.findMany({
      where: { ...teamFilter, state: "resolved" },
      orderBy: { startsAt: "desc" },
      take: 30,
      include: {
        homeTeam: { select: { id: true, name: true, slug: true, image: true } },
        awayTeam: { select: { id: true, name: true, slug: true, image: true } },
        league: { select: { name: true, slug: true, countryName: true } },
      },
    });

    return Response.json({
      team: { id: team.id, name: team.name, slug: team.slug, image: team.image, sport: team.sport },
      games: games.map((g) => ({
        id: g.id,
        azuroGameId: g.azuroGameId,
        title: g.title,
        startsAt: g.startsAt,
        homeTeam: g.homeTeam,
        awayTeam: g.awayTeam,
        league: g.league,
        winnerId: g.winnerId,
        homeScore: g.homeScore,
        awayScore: g.awayScore,
      })),
    });
  }

  if (tab === "stats") {
    const resolved = await prisma.indexedGame.findMany({
      where: { ...teamFilter, state: "resolved" },
      select: { homeTeamId: true, awayTeamId: true, winnerId: true, startsAt: true },
      orderBy: { startsAt: "desc" },
    });

    let wins = 0, draws = 0, losses = 0;
    let homeWins = 0, homePlayed = 0, awayWins = 0, awayPlayed = 0;
    const form: string[] = [];

    for (const g of resolved) {
      const isHome = g.homeTeamId === team.id;
      if (isHome) homePlayed++;
      else awayPlayed++;

      if (g.winnerId === team.id) {
        wins++;
        if (isHome) homeWins++;
        else awayWins++;
        if (form.length < 5) form.push("W");
      } else if (g.winnerId === null) {
        draws++;
        if (form.length < 5) form.push("D");
      } else {
        losses++;
        if (form.length < 5) form.push("L");
      }
    }

    return Response.json({
      team: { id: team.id, name: team.name, slug: team.slug, image: team.image, sport: team.sport },
      stats: {
        played: resolved.length,
        wins,
        draws,
        losses,
        form,
        homeRecord: { played: homePlayed, wins: homeWins },
        awayRecord: { played: awayPlayed, wins: awayWins },
      },
    });
  }

  return Response.json({ error: "Invalid tab" }, { status: 400 });
}
