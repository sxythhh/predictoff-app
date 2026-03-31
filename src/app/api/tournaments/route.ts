export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import crypto from "crypto";

// GET /api/tournaments?status=open&format=profit&cursor=xxx&limit=20
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const format = searchParams.get("format");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
  const cursor = searchParams.get("cursor");

  const where: Record<string, any> = { flagged: false };
  if (status) where.status = status;
  if (format) where.format = format;
  // Only show public + open/active/scoring/completed tournaments in listing
  if (!status) where.status = { in: ["open", "active", "scoring", "completed"] };
  where.visibility = "public";

  const tournaments = await prisma.tournament.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      creator: { select: { id: true, walletAddress: true, displayName: true, avatar: true } },
      _count: { select: { entries: true } },
    },
  });

  const hasMore = tournaments.length > limit;
  const items = hasMore ? tournaments.slice(0, limit) : tournaments;

  return Response.json({
    tournaments: items.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      format: t.format,
      entryType: t.entryType,
      entryFee: t.entryFee,
      currency: t.currency,
      prizePool: t.prizePool,
      prizeStructure: t.prizeStructure,
      maxParticipants: t.maxParticipants,
      scoringMethod: t.scoringMethod,
      scope: t.scope,
      registrationStart: t.registrationStart,
      registrationEnd: t.registrationEnd,
      startsAt: t.startsAt,
      endsAt: t.endsAt,
      status: t.status,
      participantCount: t._count.entries,
      creator: t.creator,
      createdAt: t.createdAt.toISOString(),
    })),
    nextCursor: hasMore ? items[items.length - 1].id : null,
  });
}

// POST /api/tournaments — create a new tournament
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: max 3 per day
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentCount = await prisma.tournament.count({
    where: { creatorId: user.id, createdAt: { gte: dayAgo } },
  });
  if (recentCount >= 3) {
    return Response.json({ error: "Max 3 tournaments per day" }, { status: 429 });
  }

  const body = await request.json();
  const {
    title, description, format, entryType, entryFee, currency,
    prizeStructure, maxParticipants, minParticipants, scoringMethod,
    scope, allowedGameIds, allowedSports,
    registrationStart, registrationEnd, startsAt, endsAt,
    visibility, games,
  } = body;

  // Validate required fields
  if (!title?.trim() || title.length > 100) {
    return Response.json({ error: "Title required (max 100 chars)" }, { status: 400 });
  }
  if (!["profit", "pickem"].includes(format)) {
    return Response.json({ error: "Format must be 'profit' or 'pickem'" }, { status: 400 });
  }
  if (!["free", "paid"].includes(entryType)) {
    return Response.json({ error: "entryType must be 'free' or 'paid'" }, { status: 400 });
  }
  if (entryType === "paid" && (!entryFee || entryFee <= 0)) {
    return Response.json({ error: "Entry fee required for paid tournaments" }, { status: 400 });
  }
  const now = Math.floor(Date.now() / 1000);
  if (!registrationStart || !startsAt || !endsAt || startsAt >= endsAt) {
    return Response.json({ error: "Invalid dates: startsAt must be before endsAt" }, { status: 400 });
  }
  const regEnd = registrationEnd ?? startsAt;
  if (regEnd > startsAt) {
    return Response.json({ error: "Registration must end before tournament starts" }, { status: 400 });
  }

  // Validate prize structure sums to 100%
  if (prizeStructure && typeof prizeStructure === "object") {
    const total = Object.values(prizeStructure as Record<string, number>).reduce((a: number, b: number) => a + b, 0);
    if (Math.abs(total - 100) > 0.01) {
      return Response.json({ error: `Prize percentages must sum to 100% (got ${total}%)` }, { status: 400 });
    }
  }

  // Per-minute rate limit
  const minuteAgo = new Date(Date.now() - 60 * 1000);
  const recentMinute = await prisma.tournament.count({
    where: { creatorId: user.id, createdAt: { gte: minuteAgo } },
  });
  if (recentMinute >= 1) {
    return Response.json({ error: "Please wait a minute between creating tournaments" }, { status: 429 });
  }

  const inviteCode = visibility === "private" ? crypto.randomBytes(6).toString("hex") : null;

  const tournament = await prisma.tournament.create({
    data: {
      creatorId: user.id,
      title: title.trim().slice(0, 100),
      description: description?.trim()?.slice(0, 500) ?? null,
      format,
      entryType,
      entryFee: entryType === "paid" ? entryFee : null,
      currency: currency ?? null,
      prizeStructure: prizeStructure ?? null,
      maxParticipants: maxParticipants ?? null,
      minParticipants: minParticipants ?? 2,
      scoringMethod: scoringMethod ?? (format === "pickem" ? "points" : "profit"),
      scope: scope ?? "open",
      allowedGameIds: allowedGameIds ?? null,
      allowedSports: allowedSports ?? null,
      registrationStart,
      registrationEnd: registrationEnd ?? startsAt,
      startsAt,
      endsAt,
      status: "draft",
      visibility: visibility ?? "public",
      inviteCode,
      // Create curated games if provided
      ...(games?.length ? {
        games: {
          createMany: {
            data: games.map((g: any) => ({
              gameId: g.gameId,
              gameTitle: g.gameTitle ?? null,
              sportName: g.sportName ?? null,
              leagueName: g.leagueName ?? null,
              startsAt: g.startsAt ?? 0,
            })),
          },
        },
      } : {}),
    },
    include: {
      creator: { select: { id: true, walletAddress: true, displayName: true, avatar: true } },
      _count: { select: { entries: true, games: true } },
    },
  });

  // Record activity
  prisma.activity.create({
    data: {
      userId: user.id,
      type: "tournament_created",
      metadata: { tournamentId: tournament.id, title: tournament.title, format: tournament.format },
    },
  }).catch(() => {});

  return Response.json({
    id: tournament.id,
    title: tournament.title,
    format: tournament.format,
    status: tournament.status,
    inviteCode: tournament.inviteCode,
    gameCount: tournament._count.games,
    creator: tournament.creator,
  }, { status: 201 });
}
