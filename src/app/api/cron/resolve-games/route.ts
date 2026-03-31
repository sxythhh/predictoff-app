export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { queryGameResolutions } from "@/lib/azuro-subgraph";

const CRON_SECRET = process.env.CRON_SECRET ?? "";

// POST /api/cron/resolve-games — check and update resolved games
export async function POST(request: NextRequest) {
  if (CRON_SECRET && request.headers.get("authorization") !== `Bearer ${CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const twoHoursAgo = Math.floor(Date.now() / 1000) - 2 * 60 * 60;

  // Find games that should be resolved by now
  const pendingGames = await prisma.indexedGame.findMany({
    where: {
      state: { in: ["prematch", "live"] },
      startsAt: { lt: twoHoursAgo },
    },
    take: 100,
    orderBy: { startsAt: "asc" },
    include: { homeTeam: true, awayTeam: true },
  });

  if (pendingGames.length === 0) {
    return Response.json({ resolved: 0, canceled: 0, pending: 0 });
  }

  // Query subgraph for resolution status
  const gameIds = pendingGames.map((g) => g.azuroGameId);
  const resolutions = await queryGameResolutions(gameIds);

  let resolved = 0;
  let canceled = 0;
  let pending = 0;

  for (const game of pendingGames) {
    const resolution = resolutions.get(game.azuroGameId);
    if (!resolution) { pending++; continue; }

    if (resolution.status === "Resolved") {
      // Determine winner from 1X2 outcome
      // Typically: outcome "1" = home win, "2" = away win, "X" = draw
      let winnerId: string | null = null;
      if (resolution.winnerOutcome === "1" || resolution.winnerOutcome === "home") {
        winnerId = game.homeTeamId;
      } else if (resolution.winnerOutcome === "2" || resolution.winnerOutcome === "away") {
        winnerId = game.awayTeamId;
      }
      // null = draw or undetermined

      await prisma.indexedGame.update({
        where: { id: game.id },
        data: {
          state: "resolved",
          resolvedAt: Math.floor(Date.now() / 1000),
          winnerId,
        },
      });
      resolved++;
    } else if (resolution.status === "Canceled") {
      await prisma.indexedGame.update({
        where: { id: game.id },
        data: { state: "canceled" },
      });
      canceled++;
    } else {
      pending++;
    }
  }

  return Response.json({ resolved, canceled, pending });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
