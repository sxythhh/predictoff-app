export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// DELETE /api/tournaments/[id]/leave
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const tournament = await prisma.tournament.findUnique({ where: { id } });
  if (!tournament) return Response.json({ error: "Not found" }, { status: 404 });

  // Can only leave during registration
  if (!["open"].includes(tournament.status)) {
    return Response.json({ error: "Cannot leave after tournament has started" }, { status: 400 });
  }

  const entry = await prisma.tournamentEntry.findUnique({
    where: { tournamentId_userId: { tournamentId: id, userId: user.id } },
  });
  if (!entry) return Response.json({ error: "Not joined" }, { status: 404 });

  // Delete picks and snapshots first, then the entry
  await prisma.tournamentPick.deleteMany({ where: { entryId: entry.id } });
  await prisma.tournamentBetSnapshot.deleteMany({ where: { entryId: entry.id } });
  await prisma.tournamentEntry.delete({ where: { id: entry.id } });

  // Decrement prize pool for paid tournaments
  if (tournament.entryType === "paid" && tournament.entryFee) {
    await prisma.tournament.update({
      where: { id },
      data: { prizePool: { decrement: tournament.entryFee } },
    });
  }

  return Response.json({ left: true });
}
