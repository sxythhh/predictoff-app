export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { whop } from "@/lib/whop";

// POST /api/whop/webhook — handle Whop payment events
export async function POST(request: NextRequest) {
  const body = await request.text();
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => { headers[key] = value; });

  let event;
  try {
    event = whop.webhooks.unwrap(body, { headers });
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return Response.json({ error: "Invalid webhook" }, { status: 400 });
  }

  const type = (event as any).type ?? (event as any).event;

  if (type === "payment.succeeded" || type === "payment_succeeded") {
    const data = (event as any).data ?? event;
    const metadata = data?.metadata ?? data?.checkout_configuration?.metadata ?? {};
    const { tournamentId, userId, walletAddress } = metadata;

    if (!tournamentId || !userId) {
      console.warn("Whop webhook missing tournament metadata:", metadata);
      return Response.json({ received: true });
    }

    // Check if already joined (idempotent)
    const existing = await prisma.tournamentEntry.findUnique({
      where: { tournamentId_userId: { tournamentId, userId } },
    });

    if (!existing) {
      // Create entry
      await prisma.tournamentEntry.create({
        data: {
          tournamentId,
          userId,
          walletAddress: walletAddress ?? "",
          entryPaid: true,
          entryTxHash: data?.id ?? data?.payment_id ?? null,
        },
      });

      // Increment prize pool
      const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
      if (tournament?.entryFee) {
        await prisma.tournament.update({
          where: { id: tournamentId },
          data: { prizePool: { increment: tournament.entryFee } },
        });
      }

      // Record activity
      prisma.activity.create({
        data: {
          userId,
          type: "tournament_joined",
          metadata: { tournamentId, tournamentTitle: tournament?.title ?? "" },
        },
      }).catch(() => {});
    }
  }

  return Response.json({ received: true });
}
