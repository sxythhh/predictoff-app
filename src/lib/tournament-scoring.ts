/**
 * Tournament scoring engine.
 * Handles both profit-based and pick'em tournament scoring.
 */

import { prisma } from "./prisma";
import { queryBetsByWallets, queryConditionResolutions } from "./azuro-subgraph";

/**
 * Score a profit tournament by fetching on-chain bet data.
 */
export async function scoreProfitTournament(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { entries: true },
  });
  if (!tournament || !["active", "scoring"].includes(tournament.status)) return;

  const entries = tournament.entries;
  if (entries.length === 0) return;

  // Transition to scoring if needed
  if (tournament.status === "active") {
    await prisma.tournament.update({ where: { id: tournamentId }, data: { status: "scoring" } });
  }

  // Fetch bets from subgraph for all participants
  const wallets = entries.map((e) => e.walletAddress);
  const betsByWallet = await queryBetsByWallets(wallets, tournament.startsAt, tournament.endsAt);

  const allowedGameIds = tournament.scope === "curated" && tournament.allowedGameIds
    ? new Set(tournament.allowedGameIds as string[])
    : null;

  // Process each entry
  for (const entry of entries) {
    const bets = betsByWallet.get(entry.walletAddress.toLowerCase()) ?? [];

    // Filter by allowed games if curated
    const qualifyingBets = allowedGameIds
      ? bets.filter((b) => b.selections.some((s) => allowedGameIds.has(s.outcome.condition.game.gameId)))
      : bets;

    // Upsert bet snapshots
    for (const bet of qualifyingBets) {
      const amount = parseFloat(bet.amount);
      const possibleWin = parseFloat(bet.potentialPayout);
      const payout = bet.payout ? parseFloat(bet.payout) : null;
      const isWin = bet.result === "Won";
      const isLose = bet.result === "Lost";
      const odds = possibleWin / (amount || 1);

      await prisma.tournamentBetSnapshot.upsert({
        where: { entryId_tokenId: { entryId: entry.id, tokenId: bet.tokenId } },
        create: {
          entryId: entry.id,
          tournamentId,
          tokenId: bet.tokenId,
          gameId: bet.selections[0]?.outcome.condition.game.gameId ?? "",
          amount,
          possibleWin,
          odds,
          isWin: isWin || null,
          isLose: isLose || null,
          payout,
          betCreatedAt: parseInt(bet.createdBlockTimestamp),
          resolvedAt: bet.resolvedBlockTimestamp ? parseInt(bet.resolvedBlockTimestamp) : null,
          outcomes: bet.selections.map((s) => ({
            conditionId: s.conditionId,
            outcomeId: s.outcomeId,
            odds: s.odds,
            result: s.result,
          })),
        },
        update: {
          isWin: isWin || null,
          isLose: isLose || null,
          payout,
          resolvedAt: bet.resolvedBlockTimestamp ? parseInt(bet.resolvedBlockTimestamp) : null,
        },
      });
    }

    // Calculate score
    const snapshots = await prisma.tournamentBetSnapshot.findMany({
      where: { entryId: entry.id },
    });

    let totalStaked = 0;
    let totalPayout = 0;
    for (const s of snapshots) {
      totalStaked += s.amount;
      if (s.isWin && s.payout) totalPayout += s.payout;
      else if (s.isLose) totalPayout += 0;
      // Pending bets don't contribute to payout yet
    }

    let score: number;
    if (tournament.scoringMethod === "roi") {
      score = totalStaked > 0 ? ((totalPayout - totalStaked) / totalStaked) * 100 : 0;
    } else {
      score = totalPayout - totalStaked;
    }

    await prisma.tournamentEntry.update({
      where: { id: entry.id },
      data: { score, totalStaked, totalPayout },
    });
  }

  // Rank entries
  await rankEntries(tournamentId);
}

/**
 * Score a pick'em tournament by checking condition resolutions.
 */
export async function scorePickemTournament(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { games: true },
  });
  if (!tournament || !["active", "scoring"].includes(tournament.status)) return;

  if (tournament.status === "active") {
    await prisma.tournament.update({ where: { id: tournamentId }, data: { status: "scoring" } });
  }

  // Get unresolved games
  const unresolvedGames = tournament.games.filter((g) => !g.resolved);
  if (unresolvedGames.length === 0) return; // All already scored

  // Get all condition IDs from picks on unresolved games
  const unresolvedGameIds = unresolvedGames.map((g) => g.id);
  const pendingPicks = await prisma.tournamentPick.findMany({
    where: {
      tournamentId,
      tournamentGameId: { in: unresolvedGameIds },
      isCorrect: null,
    },
  });

  if (pendingPicks.length === 0) return;

  // Query condition resolutions
  const conditionIds = [...new Set(pendingPicks.map((p) => p.conditionId))];
  const resolutions = await queryConditionResolutions(conditionIds);

  // Score each pick
  for (const pick of pendingPicks) {
    const resolution = resolutions.get(pick.conditionId);
    if (!resolution || resolution.status !== "Resolved") continue;

    const isCorrect = resolution.wonOutcomeIds.includes(pick.outcomeId);
    await prisma.tournamentPick.update({
      where: { id: pick.id },
      data: {
        isCorrect,
        pointsAwarded: isCorrect ? 1 : 0,
      },
    });
  }

  // Mark resolved games
  for (const game of unresolvedGames) {
    // Check if all picks for this game are scored
    const gamePicks = pendingPicks.filter((p) => p.tournamentGameId === game.id);
    const gameConditions = [...new Set(gamePicks.map((p) => p.conditionId))];
    const allResolved = gameConditions.every((cid) => {
      const r = resolutions.get(cid);
      return r && r.status === "Resolved";
    });
    if (allResolved) {
      await prisma.tournamentGame.update({ where: { id: game.id }, data: { resolved: true } });
    }
  }

  // Update entry scores
  const entries = await prisma.tournamentEntry.findMany({ where: { tournamentId } });
  for (const entry of entries) {
    const entryPicks = await prisma.tournamentPick.findMany({ where: { entryId: entry.id } });
    const correctPicks = entryPicks.filter((p) => p.isCorrect === true).length;
    const totalPicks = entryPicks.length;
    const score = entryPicks.reduce((sum, p) => sum + p.pointsAwarded, 0);

    await prisma.tournamentEntry.update({
      where: { id: entry.id },
      data: { score, correctPicks, totalPicks },
    });
  }

  await rankEntries(tournamentId);
}

/**
 * Rank all entries in a tournament by score descending.
 */
async function rankEntries(tournamentId: string) {
  const entries = await prisma.tournamentEntry.findMany({
    where: { tournamentId },
    orderBy: [{ score: "desc" }, { joinedAt: "asc" }],
  });

  for (let i = 0; i < entries.length; i++) {
    await prisma.tournamentEntry.update({
      where: { id: entries[i].id },
      data: { rank: i + 1 },
    });
  }
}

/**
 * Calculate and assign prizes based on prize structure.
 */
export async function distributePrizes(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament || tournament.status !== "scoring") return;

  const prizeStructure = tournament.prizeStructure as Record<string, number> | null;
  if (!prizeStructure || tournament.prizePool <= 0) {
    await prisma.tournament.update({ where: { id: tournamentId }, data: { status: "completed" } });
    return;
  }

  const entries = await prisma.tournamentEntry.findMany({
    where: { tournamentId },
    orderBy: { rank: "asc" },
  });

  for (const entry of entries) {
    if (!entry.rank) continue;
    const pct = prizeStructure[String(entry.rank)];
    if (!pct) continue;

    const prizeAmount = (tournament.prizePool * pct) / 100;
    await prisma.tournamentEntry.update({
      where: { id: entry.id },
      data: { prizeAmount },
    });

    // Record activity for winners
    if (entry.rank <= 3) {
      prisma.activity.create({
        data: {
          userId: entry.userId,
          type: "tournament_won",
          metadata: {
            tournamentId,
            tournamentTitle: tournament.title,
            rank: entry.rank,
            prizeAmount,
          },
        },
      }).catch(() => {});
    }
  }

  await prisma.tournament.update({ where: { id: tournamentId }, data: { status: "completed" } });
}
