export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/search?q=manchester&limit=10
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "8"), 20);

  if (!query || query.length < 2) {
    return Response.json({ teams: [], leagues: [] });
  }

  const pattern = `%${query}%`;

  // Search teams — case-insensitive substring match with upcoming game count
  const teams = await prisma.indexedTeam.findMany({
    where: { name: { contains: query, mode: "insensitive" } },
    include: {
      sport: { select: { name: true, slug: true } },
      _count: {
        select: {
          homeGames: { where: { state: { in: ["prematch", "live"] } } },
          awayGames: { where: { state: { in: ["prematch", "live"] } } },
        },
      },
    },
    take: limit,
    orderBy: { name: "asc" },
  });

  // Search leagues — case-insensitive on name or country
  const leagues = await prisma.indexedLeague.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { countryName: { contains: query, mode: "insensitive" } },
      ],
    },
    include: {
      sport: { select: { name: true, slug: true } },
      _count: {
        select: {
          games: { where: { state: { in: ["prematch", "live"] } } },
        },
      },
    },
    take: limit,
    orderBy: { name: "asc" },
  });

  return Response.json({
    teams: teams.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      image: t.image,
      sportName: t.sport.name,
      sportSlug: t.sport.slug,
      upcomingGamesCount: t._count.homeGames + t._count.awayGames,
    })),
    leagues: leagues.map((l) => ({
      id: l.id,
      name: l.name,
      slug: l.slug,
      countryName: l.countryName,
      countrySlug: l.countrySlug,
      sportName: l.sport.name,
      sportSlug: l.sport.slug,
      activeGamesCount: l._count.games,
    })),
  });
}
