export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { scoreProfitTournament, scorePickemTournament, distributePrizes } from "@/lib/tournament-scoring";

// POST /api/tournaments/[id]/score — trigger scoring run
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const tournament = await prisma.tournament.findUnique({ where: { id } });
  if (!tournament) return Response.json({ error: "Not found" }, { status: 404 });

  // Only creator can trigger scoring
  if (tournament.creatorId !== user.id) {
    return Response.json({ error: "Only the tournament creator can trigger scoring" }, { status: 403 });
  }

  if (!["active", "scoring"].includes(tournament.status)) {
    return Response.json({ error: "Tournament must be active or in scoring phase" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const complete = body.complete === true;

  // Run scoring based on format
  if (tournament.format === "profit") {
    await scoreProfitTournament(id);
  } else {
    await scorePickemTournament(id);
  }

  // If requested, also distribute prizes and complete
  if (complete) {
    await distributePrizes(id);
  }

  const updated = await prisma.tournament.findUnique({
    where: { id },
    include: { _count: { select: { entries: true } } },
  });

  return Response.json({
    status: updated?.status,
    participantCount: updated?._count.entries,
    scored: true,
    completed: complete,
  });
}
