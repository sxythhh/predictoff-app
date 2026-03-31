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

    // Handle tipster subscription payments
    if (metadata.type === "tipster_subscription") {
      const { subscriberId, tipsterId } = metadata;
      if (subscriberId && tipsterId) {
        await prisma.tipsterSubscription.upsert({
          where: { subscriberId_tipsterId: { subscriberId, tipsterId } },
          create: { subscriberId, tipsterId, status: "active", whopMembershipId: data?.membership_id ?? null },
          update: { status: "active", whopMembershipId: data?.membership_id ?? null },
        });
        prisma.activity.create({
          data: { userId: subscriberId, type: "tipster_subscribed", metadata: { tipsterId } },
        }).catch(() => {});
      }
      return Response.json({ received: true });
    }

    // Handle tournament entry payments
    const { tournamentId, userId, walletAddress } = metadata;
    if (!tournamentId || !userId) {
      console.warn("Whop webhook: unrecognized payment metadata:", metadata);
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

  // Handle membership deactivation (subscription canceled)
  if (type === "membership.deactivated" || type === "membership_deactivated") {
    const data = (event as any).data ?? event;
    const membershipId = data?.id ?? data?.membership_id;
    if (membershipId) {
      await prisma.tipsterSubscription.updateMany({
        where: { whopMembershipId: membershipId },
        data: { status: "canceled" },
      });
    }
  }

  return Response.json({ received: true });
}
