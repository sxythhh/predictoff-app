export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// GET /api/picks/[id]/comments?limit=20&cursor=xxx
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: pickId } = await params;
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
  const cursor = searchParams.get("cursor");

  const comments = await prisma.pickComment.findMany({
    where: { pickId },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      user: { select: { id: true, walletAddress: true, displayName: true, avatar: true } },
    },
  });

  const hasMore = comments.length > limit;
  const items = hasMore ? comments.slice(0, limit) : comments;

  return Response.json({
    comments: items.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      user: c.user,
    })),
    nextCursor: hasMore ? items[items.length - 1].id : null,
  });
}

// POST /api/picks/[id]/comments { content }
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: pickId } = await params;
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { content } = await request.json();
  if (!content?.trim() || content.length > 500) {
    return Response.json({ error: "Comment required (max 500 chars)" }, { status: 400 });
  }

  const comment = await prisma.pickComment.create({
    data: { userId: user.id, pickId, content: content.trim() },
    include: {
      user: { select: { id: true, walletAddress: true, displayName: true, avatar: true } },
    },
  });

  return Response.json({
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    user: comment.user,
  }, { status: 201 });
}
