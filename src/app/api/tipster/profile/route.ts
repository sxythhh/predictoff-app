export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// PATCH /api/tipster/profile — update tipster bio + subscription price
export async function PATCH(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.isTipster) return Response.json({ error: "Not a tipster" }, { status: 403 });

  const body = await request.json();
  const updates: Record<string, any> = {};

  if (typeof body.tipsterBio === "string") {
    updates.tipsterBio = body.tipsterBio.trim().slice(0, 300) || null;
  }
  if (typeof body.subscriptionPrice === "number" && body.subscriptionPrice >= 1 && body.subscriptionPrice <= 1000) {
    updates.subscriptionPrice = body.subscriptionPrice;
  }

  const updated = await prisma.user.update({ where: { id: user.id }, data: updates });

  return Response.json({
    tipsterBio: updated.tipsterBio,
    subscriptionPrice: updated.subscriptionPrice,
  });
}
