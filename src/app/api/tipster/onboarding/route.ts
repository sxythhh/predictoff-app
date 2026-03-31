export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { whop } from "@/lib/whop";

// GET /api/tipster/onboarding?type=onboarding|payouts — returns Whop account link
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.whopBusinessId) return Response.json({ error: "Not a tipster" }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const linkType = searchParams.get("type") ?? "account_onboarding";
  const useCase = linkType === "payouts" ? "payouts_portal" : "account_onboarding";

  try {
    const origin = request.headers.get("origin") ?? request.nextUrl.origin;
    const link = await whop.accountLinks.create({
      company_id: user.whopBusinessId,
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
