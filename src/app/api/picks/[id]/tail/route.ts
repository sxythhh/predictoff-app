export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// POST /api/picks/[id]/tail — mark as tailed (copy to betslip tracked)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: pickId } = await params;
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const pick = await prisma.tipsterPick.findUnique({ where: { id: pickId } });
  if (!pick) return Response.json({ error: "Pick not found" }, { status: 404 });

  // Can't tail own picks
  if (pick.tipsterId === user.id) return Response.json({ error: "Can't tail your own pick" }, { status: 400 });

  const existing = await prisma.pickTail.findUnique({
    where: { userId_pickId: { userId: user.id, pickId } },
  });

  if (existing) {
    const count = await prisma.pickTail.count({ where: { pickId } });
    return Response.json({ tailed: true, count });
  }

  await prisma.pickTail.create({ data: { userId: user.id, pickId } });
  const count = await prisma.pickTail.count({ where: { pickId } });

  return Response.json({
    tailed: true,
    count,
    // Return pick data so client can add to betslip
    pick: {
      gameId: pick.gameId,
      conditionId: pick.conditionId,
      outcomeId: pick.outcomeId,
      selectionName: pick.selectionName,
      marketName: pick.marketName,
      odds: pick.odds,
      gameTitle: pick.gameTitle,
    },
  });
}
