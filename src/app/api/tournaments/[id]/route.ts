export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// GET /api/tournaments/[id]
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, walletAddress: true, displayName: true, avatar: true } },
      _count: { select: { entries: true, games: true } },
    },
  });

  if (!tournament) {
    return Response.json({ error: "Tournament not found" }, { status: 404 });
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
    prizeStructure: tournament.prizeStructure,
    maxParticipants: tournament.maxParticipants,
    minParticipants: tournament.minParticipants,
    scoringMethod: tournament.scoringMethod,
    scope: tournament.scope,
    allowedGameIds: tournament.allowedGameIds,
    allowedSports: tournament.allowedSports,
    registrationStart: tournament.registrationStart,
    registrationEnd: tournament.registrationEnd,
    startsAt: tournament.startsAt,
    endsAt: tournament.endsAt,
    status: tournament.status,
    visibility: tournament.visibility,
    inviteCode: tournament.inviteCode,
    participantCount: tournament._count.entries,
    gameCount: tournament._count.games,
    creator: tournament.creator,
    createdAt: tournament.createdAt.toISOString(),
  });
}

// PATCH /api/tournaments/[id] — update (creator only, draft/open only)
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: { _count: { select: { entries: true } } },
  });
  if (!tournament) return Response.json({ error: "Not found" }, { status: 404 });
  if (tournament.creatorId !== user.id) return Response.json({ error: "Forbidden" }, { status: 403 });
  if (!["draft", "open"].includes(tournament.status)) {
    return Response.json({ error: "Can only edit draft or open tournaments" }, { status: 400 });
  }

  const body = await request.json();
  const updates: Record<string, any> = {};
  const hasEntries = tournament._count.entries > 0;

  // Always allow title/description
  if (typeof body.title === "string") updates.title = body.title.trim().slice(0, 100);
  if (typeof body.description === "string") updates.description = body.description.trim().slice(0, 500);

  // Lock economic fields once entries exist
  if (!hasEntries) {
    if (body.prizeStructure !== undefined) updates.prizeStructure = body.prizeStructure;
    if (typeof body.maxParticipants === "number") updates.maxParticipants = body.maxParticipants;
    if (typeof body.registrationEnd === "number") updates.registrationEnd = body.registrationEnd;
  }

  // Status transition: draft → open (publish)
  if (body.status === "open" && tournament.status === "draft") {
    updates.status = "open";
  }
  // Status transition: open → cancelled
  if (body.status === "cancelled" && ["draft", "open"].includes(tournament.status)) {
    updates.status = "cancelled";
  }

  const updated = await prisma.tournament.update({ where: { id }, data: updates });
  return Response.json({ id: updated.id, status: updated.status, title: updated.title });
}

// DELETE /api/tournaments/[id] — cancel (creator only, draft only or open with 0 entries)
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: { _count: { select: { entries: true } } },
  });
  if (!tournament) return Response.json({ error: "Not found" }, { status: 404 });
  if (tournament.creatorId !== user.id) return Response.json({ error: "Forbidden" }, { status: 403 });

  if (tournament.status === "draft") {
    await prisma.tournament.delete({ where: { id } });
    return Response.json({ deleted: true });
  }
  if (tournament.status === "open" && tournament._count.entries === 0) {
    await prisma.tournament.delete({ where: { id } });
    return Response.json({ deleted: true });
  }

  // Otherwise just cancel
  await prisma.tournament.update({ where: { id }, data: { status: "cancelled" } });
  return Response.json({ cancelled: true });
}
