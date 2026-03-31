export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// POST /api/tournaments/[id]/join
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: { _count: { select: { entries: true } } },
  });

  if (!tournament) return Response.json({ error: "Not found" }, { status: 404 });

  // Private tournament: require invite code
  if (tournament.visibility === "private") {
    const body2 = await request.clone().json().catch(() => ({}));
    if (body2.inviteCode !== tournament.inviteCode) {
      return Response.json({ error: "Invalid invite code for private tournament" }, { status: 403 });
    }
  }

  // Validate status
  if (!["open", "active"].includes(tournament.status)) {
    return Response.json({ error: "Tournament is not accepting entries" }, { status: 400 });
  }

  // Validate registration window
  const now = Math.floor(Date.now() / 1000);
  if (now < tournament.registrationStart || now > tournament.registrationEnd) {
    return Response.json({ error: "Registration window is closed" }, { status: 400 });
  }

  // Check max participants
  if (tournament.maxParticipants && tournament._count.entries >= tournament.maxParticipants) {
    return Response.json({ error: "Tournament is full" }, { status: 400 });
  }

  // Check if already joined
  const existing = await prisma.tournamentEntry.findUnique({
    where: { tournamentId_userId: { tournamentId: id, userId: user.id } },
  });
  if (existing) {
    return Response.json({ error: "Already joined" }, { status: 409 });
  }

  // For paid tournaments, validate entry tx
  const body = await request.json().catch(() => ({}));
  const entryTxHash = body.entryTxHash ?? null;
  const entryPaid = tournament.entryType === "free" || !!entryTxHash;

  if (tournament.entryType === "paid" && !entryTxHash) {
    return Response.json({ error: "Entry fee payment required (provide entryTxHash)" }, { status: 400 });
  }

  // Create entry
  const entry = await prisma.tournamentEntry.create({
    data: {
      tournamentId: id,
      userId: user.id,
      walletAddress: user.walletAddress,
      entryTxHash,
      entryPaid,
    },
  });

  // Increment prize pool for paid tournaments
  if (tournament.entryType === "paid" && tournament.entryFee) {
    await prisma.tournament.update({
      where: { id },
      data: { prizePool: { increment: tournament.entryFee } },
    });
  }

  // Record activity
  prisma.activity.create({
    data: {
      userId: user.id,
      type: "tournament_joined",
      metadata: { tournamentId: id, tournamentTitle: tournament.title },
    },
  }).catch(() => {});

  return Response.json({
    entryId: entry.id,
    tournamentId: id,
    joined: true,
  }, { status: 201 });
}
