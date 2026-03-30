export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// GET /api/comments?gameId=xxx&cursor=xxx&limit=20
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const gameId = searchParams.get("gameId");
  const cursor = searchParams.get("cursor");
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);

  if (!gameId) {
    return Response.json({ error: "gameId required" }, { status: 400 });
  }

  const comments = await prisma.comment.findMany({
    where: { gameId },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      user: { select: { id: true, walletAddress: true, displayName: true, avatar: true } },
      _count: { select: { likes: true } },
    },
  });

  const hasMore = comments.length > limit;
  const items = hasMore ? comments.slice(0, limit) : comments;

  return Response.json({
    comments: items.map((c) => ({
      id: c.id,
      gameId: c.gameId,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      user: c.user,
      likeCount: c._count.likes,
    })),
    nextCursor: hasMore ? items[items.length - 1]?.id : null,
  });
}

// POST /api/comments { gameId, content }
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { gameId, content } = await request.json();
  if (!gameId || !content?.trim()) {
    return Response.json({ error: "gameId and content required" }, { status: 400 });
  }

  if (content.length > 1000) {
    return Response.json({ error: "Comment too long (max 1000 chars)" }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: { userId: user.id, gameId, content: content.trim() },
    include: {
      user: { select: { id: true, walletAddress: true, displayName: true, avatar: true } },
      _count: { select: { likes: true } },
    },
  });

  return Response.json({
    id: comment.id,
    gameId: comment.gameId,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    user: comment.user,
    likeCount: comment._count.likes,
  }, { status: 201 });
}
