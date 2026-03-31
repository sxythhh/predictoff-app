export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// GET /api/picks/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser(request);

  const pick = await prisma.tipsterPick.findUnique({
    where: { id },
    include: {
      tipster: { select: { id: true, walletAddress: true, displayName: true, avatar: true, isTipster: true, subscriptionPrice: true } },
    },
  });

  if (!pick) return Response.json({ error: "Not found" }, { status: 404 });

  // Check premium access
  let hasAccess = pick.visibility === "free";
  if (!hasAccess && user) {
    if (user.id === pick.tipsterId) hasAccess = true;
    else {
      const sub = await prisma.tipsterSubscription.findUnique({
        where: { subscriberId_tipsterId: { subscriberId: user.id, tipsterId: pick.tipsterId } },
      });
      if (sub?.status === "active") hasAccess = true;
    }
  }

  return Response.json({
    id: pick.id,
    gameId: pick.gameId,
    gameTitle: pick.gameTitle,
    sportSlug: pick.sportSlug,
    leagueName: pick.leagueName,
    conditionId: pick.conditionId,
    outcomeId: pick.outcomeId,
    marketName: pick.marketName,
    selectionName: hasAccess ? pick.selectionName : null,
    odds: hasAccess ? pick.odds : null,
    confidence: hasAccess ? pick.confidence : null,
    analysis: hasAccess ? pick.analysis : null,
    startsAt: pick.startsAt,
    visibility: pick.visibility,
    isResolved: pick.isResolved,
    isCorrect: pick.isCorrect,
    createdAt: pick.createdAt.toISOString(),
    tipster: pick.tipster,
    hasAccess,
  });
}

// DELETE /api/picks/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const pick = await prisma.tipsterPick.findUnique({ where: { id } });
  if (!pick) return Response.json({ error: "Not found" }, { status: 404 });
  if (pick.tipsterId !== user.id) return Response.json({ error: "Forbidden" }, { status: 403 });

  await prisma.tipsterPick.delete({ where: { id } });
  return Response.json({ deleted: true });
}
