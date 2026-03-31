export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { whop, WHOP_COMPANY_ID } from "@/lib/whop";

// POST /api/tipster/setup — become a tipster (creates Whop connected business)
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (user.isTipster && user.whopBusinessId) {
    return Response.json({ error: "Already a tipster", whopBusinessId: user.whopBusinessId }, { status: 409 });
  }

  const body = await request.json().catch(() => ({}));
  const tipsterBio = (body.tipsterBio ?? "").trim().slice(0, 300);
  const subscriptionPrice = body.subscriptionPrice ? Math.max(1, Math.min(1000, parseFloat(body.subscriptionPrice))) : 20;

  if (!WHOP_COMPANY_ID) {
    // Whop not configured — set up as tipster locally without Whop
    await prisma.user.update({
      where: { id: user.id },
      data: { isTipster: true, tipsterBio: tipsterBio || null, subscriptionPrice },
    });
    return Response.json({ success: true, whopConfigured: false });
  }

  try {
    // Create Whop connected account (child business)
    const company = await whop.companies.create({
      parent_company_id: WHOP_COMPANY_ID,
      title: `Picks by ${user.displayName ?? user.walletAddress.slice(0, 10)}`,
      metadata: { walietUserId: user.id, walletAddress: user.walletAddress },
    });

    // Create default product + plan
    const product = await whop.products.create({
      company_id: company.id,
      title: "Premium Picks",
    });

    const plan = await whop.plans.create({
      company_id: company.id,
      product_id: product.id,
      plan_type: "renewal",
      billing_period: 30,
      initial_price: subscriptionPrice,
      currency: "usd",
    });

    // Update user as tipster
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isTipster: true,
        whopBusinessId: company.id,
        whopProductId: product.id,
        whopPlanId: plan.id,
        tipsterBio: tipsterBio || null,
        subscriptionPrice,
      },
    });

    // Record activity
    prisma.activity.create({
      data: { userId: user.id, type: "tipster_setup", metadata: { whopBusinessId: company.id } },
    }).catch(() => {});

    return Response.json({
      success: true,
      whopBusinessId: company.id,
      whopProductId: product.id,
      whopPlanId: plan.id,
    }, { status: 201 });
  } catch (err: any) {
    console.error("Whop tipster setup error:", err);
    // Fallback: set up locally without Whop
    await prisma.user.update({
      where: { id: user.id },
      data: { isTipster: true, tipsterBio: tipsterBio || null, subscriptionPrice },
    });
    return Response.json({ success: true, whopConfigured: false, error: err.message });
  }
}
