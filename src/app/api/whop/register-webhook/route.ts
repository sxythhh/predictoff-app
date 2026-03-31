export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { whop } from "@/lib/whop";

// POST /api/whop/register-webhook — register webhook with Whop (one-time setup)
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const origin = request.headers.get("origin") ?? request.nextUrl.origin;

  try {
    const webhook = await whop.webhooks.create({
      url: `${origin}/api/whop/webhook`,
      events: [
        "payment.succeeded",
        "payment.failed",
        "membership.activated",
        "membership.deactivated",
        "membership.cancel_at_period_end_changed",
        "verification.succeeded",
        "payout_account.status_updated",
        "dispute.created",
        "dispute_alert.created",
        "refund.created",
        "withdrawal.updated",
      ],
      child_resource_events: true, // Receive events from connected accounts (tipsters)
      api_version: "v1",
      enabled: true,
    });

    return Response.json({
      webhookId: webhook.id,
      secret: (webhook as any).secret ?? null,
      message: "Webhook registered. Save the returned secret as WHOP_WEBHOOK_SECRET.",
    });
  } catch (err: any) {
    console.error("Webhook registration failed:", err);
    return Response.json({ error: err.message ?? "Failed to register webhook" }, { status: 500 });
  }
}
