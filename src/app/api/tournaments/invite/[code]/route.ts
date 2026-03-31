export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/tournaments/invite/[code] — lookup by invite code
export async function GET(_request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: { inviteCode: code },
    include: {
      creator: { select: { id: true, walletAddress: true, displayName: true, avatar: true } },
      _count: { select: { entries: true } },
    },
  });

  if (!tournament) {
    return Response.json({ error: "Invalid invite code" }, { status: 404 });
  }

  return Response.json({
    id: tournament.id,
    title: tournament.title,
    description: tournament.description,
    format: tournament.format,
    entryType: tournament.entryType,
    entryFee: tournament.entryFee,
    currency: tournament.currency,
    prizePool: tournament.prizePool,
    status: tournament.status,
    startsAt: tournament.startsAt,
    endsAt: tournament.endsAt,
    participantCount: tournament._count.entries,
    maxParticipants: tournament.maxParticipants,
    creator: tournament.creator,
  });
}
