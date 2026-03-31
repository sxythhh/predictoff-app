export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { whop, WHOP_COMPANY_ID } from "@/lib/whop";

// POST /api/whop/create-checkout — create Whop checkout for tournament entry fee
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { tournamentId } = await request.json();
  if (!tournamentId) return Response.json({ error: "tournamentId required" }, { status: 400 });

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { _count: { select: { entries: true } } },
  });

  if (!tournament) return Response.json({ error: "Tournament not found" }, { status: 404 });
  if (tournament.entryType !== "paid" || !tournament.entryFee) {
    return Response.json({ error: "This tournament is free" }, { status: 400 });
  }
  if (!["open", "active"].includes(tournament.status)) {
    return Response.json({ error: "Tournament not accepting entries" }, { status: 400 });
  }

  // Check not already joined
  const existing = await prisma.tournamentEntry.findUnique({
    where: { tournamentId_userId: { tournamentId, userId: user.id } },
  });
  if (existing) return Response.json({ error: "Already joined" }, { status: 409 });

  if (!WHOP_COMPANY_ID) {
    return Response.json({ error: "Payment not configured" }, { status: 500 });
  }

  try {
    const origin = request.headers.get("origin") ?? request.nextUrl.origin;

    const checkout = await whop.checkoutConfigurations.create({
      plan: {
        company_id: WHOP_COMPANY_ID,
        currency: "usd",
        initial_price: tournament.entryFee,
        plan_type: "one_time",
        product: {
          title: `Tournament Entry: ${tournament.title}`,
          external_identifier: `tournament_${tournamentId}`,
        },
      },
      metadata: {
        tournamentId,
        userId: user.id,
        walletAddress: user.walletAddress,
      },
      redirect_url: `${origin}/tournaments/${tournamentId}?joined=true`,
      source_url: `${origin}/tournaments/${tournamentId}`,
    });

    return Response.json({
      checkoutId: checkout.id,
      checkoutUrl: checkout.purchase_url,
    });
  } catch (err: any) {
    console.error("Whop checkout error:", err);
    return Response.json({ error: "Failed to create checkout" }, { status: 500 });
  }
}
