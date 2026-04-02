export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { whop, WHOP_COMPANY_ID } from "@/lib/whop";

// GET /api/tipster/onboarding?type=onboarding|payouts — returns Whop account link
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.isTipster) return Response.json({ error: "Not a tipster" }, { status: 400 });

  // If the user became a tipster but Whop setup failed previously, retry it now
  let businessId = user.whopBusinessId;
  if (!businessId) {
    if (!WHOP_COMPANY_ID) {
      return Response.json(
        { error: "Payment provider not configured. Contact support." },
        { status: 503 },
      );
    }

    try {
      const company = await whop.companies.create({
        parent_company_id: WHOP_COMPANY_ID,
        title: `Picks by ${user.displayName ?? user.walletAddress.slice(0, 10)}`,
        ...(user.email ? { email: user.email } : {}),
        metadata: { walietUserId: user.id, walletAddress: user.walletAddress },
      });

      const product = await whop.products.create({
        company_id: company.id,
        title: "Premium Picks",
      });

      const plan = await whop.plans.create({
        company_id: company.id,
        product_id: product.id,
        plan_type: "renewal",
        billing_period: 30,
        initial_price: user.subscriptionPrice ?? 20,
        currency: "usd",
      });

      await prisma.user.update({
        where: { id: user.id },
        data: {
          whopBusinessId: company.id,
          whopProductId: product.id,
          whopPlanId: plan.id,
        },
      });

      businessId = company.id;
    } catch (err: any) {
      console.error("Whop business creation retry failed:", err);
      return Response.json(
        { error: "Failed to set up payment account. Please try again." },
        { status: 500 },
      );
    }
  }

  const { searchParams } = new URL(request.url);
  const linkType = searchParams.get("type") ?? "account_onboarding";
  const useCase = linkType === "payouts" ? "payouts_portal" : "account_onboarding";

  try {
    const origin = request.headers.get("origin") ?? request.nextUrl.origin;
    const link = await whop.accountLinks.create({
      company_id: businessId,
      use_case: useCase as any,
      refresh_url: `${origin}/tipster/dashboard`,
      return_url: `${origin}/tipster/dashboard`,
    });
    return Response.json({ url: link.url });
  } catch (err: any) {
    console.error("Whop account link error:", err);
    return Response.json({ error: "Failed to generate link" }, { status: 500 });
  }
}
