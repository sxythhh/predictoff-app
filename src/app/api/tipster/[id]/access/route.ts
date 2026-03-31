export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// GET /api/tipster/[id]/access — check if user has premium access to tipster's picks
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: tipsterId } = await params;
  const user = await getAuthUser(request);
  if (!user) return Response.json({ hasAccess: false });

  // Tipsters always have access to their own picks
  if (user.id === tipsterId) return Response.json({ hasAccess: true });

  const subscription = await prisma.tipsterSubscription.findUnique({
    where: { subscriberId_tipsterId: { subscriberId: user.id, tipsterId } },
  });

  const hasAccess = subscription?.status === "active";
  return Response.json({ hasAccess });
}
