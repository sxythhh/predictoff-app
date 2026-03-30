export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// GET /api/favorites — get user's favorite game IDs
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    select: { gameId: true },
  });

  return Response.json({ gameIds: favorites.map((f) => f.gameId) });
}

// POST /api/favorites { gameId } — toggle favorite
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { gameId } = await request.json();
  if (!gameId) {
    return Response.json({ error: "gameId required" }, { status: 400 });
  }

  const existing = await prisma.favorite.findUnique({
    where: { userId_gameId: { userId: user.id, gameId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return Response.json({ favorited: false });
  }

  await prisma.favorite.create({
    data: { userId: user.id, gameId },
  });

  return Response.json({ favorited: true });
}
