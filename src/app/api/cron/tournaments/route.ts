export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { scoreProfitTournament, scorePickemTournament, distributePrizes } from "@/lib/tournament-scoring";

const CRON_SECRET = process.env.CRON_SECRET ?? "";

// POST /api/cron/tournaments — lifecycle state transitions
// Called by Vercel Cron every 5 minutes
export async function POST(request: NextRequest) {
  // Verify caller is Vercel Cron or has the secret
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const now = Math.floor(Date.now() / 1000);
  const results: string[] = [];

  // 1. open → active: startsAt reached AND minParticipants met
  const readyToStart = await prisma.tournament.findMany({
    where: { status: "open", startsAt: { lte: now } },
    include: { _count: { select: { entries: true } } },
  });
  for (const t of readyToStart) {
    if (t._count.entries >= t.minParticipants) {
      await prisma.tournament.update({ where: { id: t.id }, data: { status: "active" } });
      results.push(`${t.id}: open → active`);
    } else if (now > t.registrationEnd + 3600) {
      // Grace period passed (1 hour after registration end), cancel
      await prisma.tournament.update({ where: { id: t.id }, data: { status: "cancelled" } });
      results.push(`${t.id}: open → cancelled (min not met)`);
    }
  }

  // 2. active → scoring: endsAt reached
  const readyToScore = await prisma.tournament.findMany({
    where: { status: "active", endsAt: { lte: now } },
  });
  for (const t of readyToScore) {
    await prisma.tournament.update({ where: { id: t.id }, data: { status: "scoring" } });
    results.push(`${t.id}: active → scoring`);
  }

  // 3. Run scoring for tournaments in scoring state
  const scoring = await prisma.tournament.findMany({
    where: { status: "scoring" },
  });
  for (const t of scoring) {
    try {
      if (t.format === "profit") {
        await scoreProfitTournament(t.id);
      } else {
        await scorePickemTournament(t.id);
      }

      // Check if all games resolved (for curated tournaments)
      if (t.scope === "curated") {
        const unresolvedCount = await prisma.tournamentGame.count({
          where: { tournamentId: t.id, resolved: false },
        });
        if (unresolvedCount === 0) {
          await distributePrizes(t.id);
          results.push(`${t.id}: scoring → completed`);
        }
      } else if (now > t.endsAt + 48 * 3600) {
        // Open scope: complete after 48h settlement window
        await distributePrizes(t.id);
        results.push(`${t.id}: scoring → completed (48h passed)`);
      }

      results.push(`${t.id}: scored`);
    } catch (err) {
      console.error(`Scoring failed for ${t.id}:`, err);
      results.push(`${t.id}: scoring error`);
    }
  }

  return Response.json({ processed: results.length, transitions: results });
}

// Also support GET for Vercel Cron (it sends GET by default)
export async function GET(request: NextRequest) {
  return POST(request);
}
