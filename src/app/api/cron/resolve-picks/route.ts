export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { queryConditionResolutions } from "@/lib/azuro-subgraph";

const CRON_SECRET = process.env.CRON_SECRET ?? "";

// POST /api/cron/resolve-picks — resolve tipster picks
export async function POST(request: NextRequest) {
  if (CRON_SECRET && request.headers.get("authorization") !== `Bearer ${CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const twoHoursAgo = Math.floor(Date.now() / 1000) - 2 * 60 * 60;

  // Find unresolved picks where game should have ended
  const pending = await prisma.tipsterPick.findMany({
    where: { isResolved: false, startsAt: { lt: twoHoursAgo } },
    take: 200,
    orderBy: { startsAt: "asc" },
  });

  if (pending.length === 0) {
    return Response.json({ resolved: 0, pending: 0 });
  }

  // Get unique condition IDs
  const conditionIds = [...new Set(pending.map((p) => p.conditionId))];
  const resolutions = await queryConditionResolutions(conditionIds);

  let resolved = 0;

  for (const pick of pending) {
    const resolution = resolutions.get(pick.conditionId);
    if (!resolution || resolution.status !== "Resolved") continue;

    const isCorrect = resolution.wonOutcomeIds.includes(pick.outcomeId);

    await prisma.tipsterPick.update({
      where: { id: pick.id },
      data: { isResolved: true, isCorrect, resolvedAt: new Date() },
    });

    // Record activity for the tipster
    prisma.activity.create({
      data: {
        userId: pick.tipsterId,
        type: isCorrect ? "pick_won" : "pick_lost",
        metadata: { pickId: pick.id, gameTitle: pick.gameTitle, selectionName: pick.selectionName },
      },
    }).catch(() => {});

    resolved++;
  }

  return Response.json({ resolved, pending: pending.length - resolved });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
