export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { whop } from "@/lib/whop";

// GET /api/tipster/onboarding — returns Whop account link for KYC/payout setup
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.whopBusinessId) return Response.json({ error: "Not a tipster" }, { status: 400 });

  try {
    const origin = request.headers.get("origin") ?? request.nextUrl.origin;
    const link = await whop.accountLinks.create({
      company_id: user.whopBusinessId,
      use_case: "account_onboarding",
      refresh_url: `${origin}/tipster/setup`,
      return_url: `${origin}/profile`,
    });
    return Response.json({ url: link.url });
  } catch (err: any) {
    console.error("Whop onboarding link error:", err);
    return Response.json({ error: "Failed to generate onboarding link" }, { status: 500 });
  }
}
