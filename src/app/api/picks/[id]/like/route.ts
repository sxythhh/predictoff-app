export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// POST /api/picks/[id]/like — toggle like
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: pickId } = await params;
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.pickLike.findUnique({
    where: { userId_pickId: { userId: user.id, pickId } },
  });

  if (existing) {
    await prisma.pickLike.delete({ where: { id: existing.id } });
    const count = await prisma.pickLike.count({ where: { pickId } });
    return Response.json({ liked: false, count });
  }

  await prisma.pickLike.create({ data: { userId: user.id, pickId } });
  const count = await prisma.pickLike.count({ where: { pickId } });
  return Response.json({ liked: true, count });
}
