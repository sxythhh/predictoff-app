export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// GET /api/subscriptions — list current user's subscriptions
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const subscriptions = await prisma.tipsterSubscription.findMany({
    where: { subscriberId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      tipster: {
        select: {
          id: true, walletAddress: true, displayName: true, avatar: true,
          tipsterBio: true, subscriptionPrice: true,
          _count: { select: { tipsterPicks: true } },
        },
      },
    },
  });

  return Response.json({
    subscriptions: subscriptions.map((s) => ({
      id: s.id,
      tipster: {
        id: s.tipster.id,
        displayName: s.tipster.displayName,
        avatar: s.tipster.avatar,
        walletAddress: s.tipster.walletAddress,
        tipsterBio: s.tipster.tipsterBio,
        subscriptionPrice: s.tipster.subscriptionPrice,
        totalPicks: s.tipster._count.tipsterPicks,
      },
      status: s.status,
      tier: s.tier,
      createdAt: s.createdAt.toISOString(),
      expiresAt: s.expiresAt?.toISOString() ?? null,
    })),
  });
}

// DELETE /api/subscriptions?tipsterId=xxx — cancel subscription
export async function DELETE(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const tipsterId = searchParams.get("tipsterId");
  if (!tipsterId) return Response.json({ error: "tipsterId required" }, { status: 400 });

  const sub = await prisma.tipsterSubscription.findUnique({
    where: { subscriberId_tipsterId: { subscriberId: user.id, tipsterId } },
  });
  if (!sub) return Response.json({ error: "Subscription not found" }, { status: 404 });

  await prisma.tipsterSubscription.update({
    where: { id: sub.id },
    data: { status: "canceled" },
  });

  return Response.json({ canceled: true });
}
