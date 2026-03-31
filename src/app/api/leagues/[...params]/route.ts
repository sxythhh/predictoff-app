export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeStandings } from "@/lib/standings";

// GET /api/leagues/[sportSlug]/[countrySlug]/[leagueSlug]?tab=standings|results
export async function GET(_request: NextRequest, { params }: { params: Promise<{ params: string[] }> }) {
  const segments = (await params).params;
  if (segments.length < 3) return Response.json({ error: "Invalid path" }, { status: 400 });

  const [sportSlug, countrySlug, leagueSlug] = segments;
  const { searchParams } = new URL(_request.url);
  const tab = searchParams.get("tab") ?? "standings";

  const league = await prisma.indexedLeague.findFirst({
    where: {
      slug: leagueSlug,
      countrySlug,
      sport: { slug: sportSlug },
    },
    include: { sport: { select: { name: true, slug: true } } },
  });

  if (!league) return Response.json({ error: "League not found" }, { status: 404 });

  if (tab === "standings") {
    const standings = await computeStandings(league.id);
    return Response.json({
      league: { id: league.id, name: league.name, countryName: league.countryName, countrySlug: league.countrySlug, sport: league.sport },
      standings,
    });
  }

  if (tab === "results") {
    const games = await prisma.indexedGame.findMany({
      where: { leagueId: league.id, state: "resolved" },
      orderBy: { startsAt: "desc" },
      take: 30,
      include: {
        homeTeam: { select: { id: true, name: true, slug: true, image: true } },
        awayTeam: { select: { id: true, name: true, slug: true, image: true } },
      },
    });

    return Response.json({
      league: { id: league.id, name: league.name, countryName: league.countryName, countrySlug: league.countrySlug, sport: league.sport },
      games: games.map((g) => ({
        id: g.id,
        azuroGameId: g.azuroGameId,
        title: g.title,
        startsAt: g.startsAt,
        homeTeam: g.homeTeam,
        awayTeam: g.awayTeam,
        winnerId: g.winnerId,
        homeScore: g.homeScore,
        awayScore: g.awayScore,
      })),
    });
  }

  return Response.json({ error: "Invalid tab" }, { status: 400 });
}
