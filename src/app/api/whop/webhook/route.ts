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
      // Look up wallet address from user if not in metadata
      let resolvedWallet = walletAddress ?? "";
      if (!resolvedWallet) {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { walletAddress: true } });
        resolvedWallet = user?.walletAddress ?? "";
      }

      // Create entry
      await prisma.tournamentEntry.create({
        data: {
          tournamentId,
          userId,
          walletAddress: resolvedWallet,
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

  // Handle membership activation (more reliable than payment.succeeded for access)
  if (type === "membership.activated" || type === "membership_activated") {
    const data = (event as any).data ?? event;
    const membershipId = data?.id;
    const metadata = data?.metadata ?? {};
    if (metadata.subscriberId && metadata.tipsterId) {
      await prisma.tipsterSubscription.upsert({
        where: { subscriberId_tipsterId: { subscriberId: metadata.subscriberId, tipsterId: metadata.tipsterId } },
        create: { subscriberId: metadata.subscriberId, tipsterId: metadata.tipsterId, status: "active", whopMembershipId: membershipId },
        update: { status: "active", whopMembershipId: membershipId },
      });
    }
  }

  // Handle membership deactivation (subscription canceled/expired)
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

  // Handle pending cancellation (subscriber set to cancel at period end)
  if (type === "membership.cancel_at_period_end_changed") {
    const data = (event as any).data ?? event;
    const membershipId = data?.id;
    const cancelAtPeriodEnd = data?.cancel_at_period_end;
    if (membershipId && cancelAtPeriodEnd) {
      await prisma.tipsterSubscription.updateMany({
        where: { whopMembershipId: membershipId },
        data: { status: "canceled" },
      });
    }
  }

  // Handle payment failure (subscription past due)
  if (type === "payment.failed" || type === "payment_failed") {
    const data = (event as any).data ?? event;
    const membershipId = data?.membership_id ?? data?.membership;
    if (membershipId) {
      await prisma.tipsterSubscription.updateMany({
        where: { whopMembershipId: membershipId },
        data: { status: "expired" },
      });
    }
  }

  // Handle refunds — revoke access
  if (type === "refund.created" || type === "refund_created") {
    const data = (event as any).data ?? event;
    const paymentId = data?.payment_id ?? data?.payment;
    if (paymentId) {
      console.log(`[webhook] Refund created for payment ${paymentId}`);
      // Could look up the membership via payment and deactivate, but membership.deactivated should also fire
    }
  }

  // Handle disputes — log for review
  if (type === "dispute.created" || type === "dispute_alert.created") {
    const data = (event as any).data ?? event;
    console.warn(`[webhook] Dispute/alert created:`, data?.id, data?.reason);
  }

  // Handle payout account status updates — track tipster readiness
  if (type === "payout_account.status_updated") {
    const data = (event as any).data ?? event;
    const companyId = data?.company_id;
    const status = data?.status; // 'connected' | 'disabled' | 'action_required' | etc.
    if (companyId) {
      console.log(`[webhook] Payout account status for ${companyId}: ${status}`);
      // Could update a tipster readiness flag in the database
    }
  }

  return Response.json({ received: true });
}
