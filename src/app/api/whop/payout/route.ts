export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { whop, WHOP_COMPANY_ID } from "@/lib/whop";
import crypto from "crypto";

// POST /api/whop/payout — transfer prize to tournament winner
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { tournamentId, entryId } = await request.json();
  if (!tournamentId || !entryId) {
    return Response.json({ error: "tournamentId and entryId required" }, { status: 400 });
  }

  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) return Response.json({ error: "Tournament not found" }, { status: 404 });

  // Only creator can initiate payouts
  if (tournament.creatorId !== user.id) {
    return Response.json({ error: "Only tournament creator can send payouts" }, { status: 403 });
  }
  if (tournament.status !== "completed") {
    return Response.json({ error: "Tournament must be completed before payouts" }, { status: 400 });
  }

  const entry = await prisma.tournamentEntry.findUnique({
    where: { id: entryId },
    include: { user: true },
  });
  if (!entry || entry.tournamentId !== tournamentId) {
    return Response.json({ error: "Entry not found" }, { status: 404 });
  }
  if (!entry.prizeAmount || entry.prizeAmount <= 0) {
    return Response.json({ error: "No prize to distribute" }, { status: 400 });
  }
  if (entry.prizePaid) {
    return Response.json({ error: "Prize already paid" }, { status: 409 });
  }

  if (!WHOP_COMPANY_ID) {
    return Response.json({ error: "Payment not configured" }, { status: 500 });
  }

  try {
    const transfer = await whop.transfers.create({
      amount: entry.prizeAmount,
      currency: "usd",
      origin_id: WHOP_COMPANY_ID,
      destination_id: entry.userId, // Whop user ID or wallet
      idempotence_key: `prize_${tournamentId}_${entryId}_${crypto.randomUUID()}`,
      notes: `Prize: #${entry.rank} in "${tournament.title}"`,
      metadata: {
        tournamentId,
        entryId,
        rank: entry.rank,
      },
    });

    await prisma.tournamentEntry.update({
      where: { id: entryId },
      data: { prizePaid: true, prizeTxHash: transfer.id },
    });

    return Response.json({
      transferId: transfer.id,
      amount: entry.prizeAmount,
      paid: true,
    });
  } catch (err: any) {
    console.error("Whop payout error:", err);
    return Response.json({ error: "Failed to process payout" }, { status: 500 });
  }
}
