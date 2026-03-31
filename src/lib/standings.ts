import { prisma } from "./prisma";

export interface StandingRow {
  team: { id: string; name: string; slug: string; image: string | null };
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  form: string[]; // Last 5: ["W","D","L","W","W"]
}

export async function computeStandings(leagueId: string): Promise<StandingRow[]> {
  const games = await prisma.indexedGame.findMany({
    where: { leagueId, state: "resolved" },
    orderBy: { startsAt: "desc" },
    include: {
      homeTeam: { select: { id: true, name: true, slug: true, image: true } },
      awayTeam: { select: { id: true, name: true, slug: true, image: true } },
    },
  });

  const teamMap = new Map<string, StandingRow>();

  function getOrCreate(team: { id: string; name: string; slug: string; image: string | null }): StandingRow {
    if (!teamMap.has(team.id)) {
      teamMap.set(team.id, { team, played: 0, wins: 0, draws: 0, losses: 0, points: 0, form: [] });
    }
    return teamMap.get(team.id)!;
  }

  // Games are ordered DESC by startsAt, so first games processed = most recent (for form)
  for (const game of games) {
    const home = getOrCreate(game.homeTeam);
    const away = getOrCreate(game.awayTeam);

    home.played++;
    away.played++;

    if (game.winnerId === game.homeTeamId) {
      home.wins++; home.points += 3;
      away.losses++;
      if (home.form.length < 5) home.form.push("W");
      if (away.form.length < 5) away.form.push("L");
    } else if (game.winnerId === game.awayTeamId) {
      away.wins++; away.points += 3;
      home.losses++;
      if (home.form.length < 5) home.form.push("L");
      if (away.form.length < 5) away.form.push("W");
    } else {
      // Draw
      home.draws++; home.points += 1;
      away.draws++; away.points += 1;
      if (home.form.length < 5) home.form.push("D");
      if (away.form.length < 5) away.form.push("D");
    }
  }

  return [...teamMap.values()].sort((a, b) => b.points - a.points || b.wins - a.wins);
}
