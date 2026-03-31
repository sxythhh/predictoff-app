export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { whop, WHOP_COMPANY_ID } from "@/lib/whop";

const PLATFORM_FEE_RATE = 0.10; // 10%

// POST /api/tipster/[id]/subscribe — create Whop checkout for subscription
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: tipsterId } = await params;
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const tipster = await prisma.user.findUnique({ where: { id: tipsterId } });
  if (!tipster || !tipster.isTipster) return Response.json({ error: "Tipster not found" }, { status: 404 });

  // Check existing subscription
  const existing = await prisma.tipsterSubscription.findUnique({
    where: { subscriberId_tipsterId: { subscriberId: user.id, tipsterId } },
  });
  if (existing?.status === "active") {
    return Response.json({ error: "Already subscribed" }, { status: 409 });
  }

  const price = tipster.subscriptionPrice ?? 20;
  const origin = request.headers.get("origin") ?? request.nextUrl.origin;

  // If Whop is configured and tipster has a Whop plan
  if (tipster.whopBusinessId && tipster.whopPlanId) {
    try {
      const checkout = await whop.checkoutConfigurations.create({
        plan: {
          company_id: tipster.whopBusinessId,
          currency: "usd",
          initial_price: price,
          plan_type: "renewal",
          billing_period: 30,
          application_fee_amount: Math.round(price * PLATFORM_FEE_RATE * 100) / 100,
        },
        metadata: { subscriberId: user.id, tipsterId, type: "tipster_subscription" },
        redirect_url: `${origin}/tipster/${tipsterId}?subscribed=true`,
        source_url: `${origin}/tipster/${tipsterId}`,
      });

      return Response.json({ checkoutUrl: checkout.purchase_url });
    } catch (err: any) {
      console.error("Whop subscription checkout error:", err);
      return Response.json({ error: "Failed to create checkout" }, { status: 500 });
    }
  }

  // Fallback: create local subscription without Whop
  await prisma.tipsterSubscription.upsert({
    where: { subscriberId_tipsterId: { subscriberId: user.id, tipsterId } },
    create: { subscriberId: user.id, tipsterId, status: "active" },
    update: { status: "active" },
  });

  return Response.json({ subscribed: true });
}
