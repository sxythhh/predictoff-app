export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// GET /api/tournaments/my — tournaments created by or joined by current user
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [created, joined] = await Promise.all([
    prisma.tournament.findMany({
      where: { creatorId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        _count: { select: { entries: true } },
      },
    }),
    prisma.tournamentEntry.findMany({
      where: { userId: user.id },
      orderBy: { joinedAt: "desc" },
      take: 50,
      include: {
        tournament: {
          include: {
            creator: { select: { id: true, displayName: true, avatar: true } },
            _count: { select: { entries: true } },
          },
        },
      },
    }),
  ]);

  return Response.json({
    created: created.map((t) => ({
      id: t.id,
      title: t.title,
      format: t.format,
      entryType: t.entryType,
      prizePool: t.prizePool,
      status: t.status,
      startsAt: t.startsAt,
      endsAt: t.endsAt,
      participantCount: t._count.entries,
    })),
    joined: joined.map((e) => ({
      entryId: e.id,
      score: e.score,
      rank: e.rank,
      tournament: {
        id: e.tournament.id,
        title: e.tournament.title,
        format: e.tournament.format,
        entryType: e.tournament.entryType,
        prizePool: e.tournament.prizePool,
        status: e.tournament.status,
        startsAt: e.tournament.startsAt,
        endsAt: e.tournament.endsAt,
        participantCount: e.tournament._count.entries,
        creator: e.tournament.creator,
      },
    })),
  });
}
