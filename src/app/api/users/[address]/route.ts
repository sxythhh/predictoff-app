export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/users/[address] — public profile data
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  const normalized = address.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { walletAddress: normalized },
    select: {
      id: true,
      walletAddress: true,
      displayName: true,
      avatar: true,
      bio: true,
      profileVisibility: true,
      showBetHistory: true,
      showStats: true,
      createdAt: true,
      _count: { select: { favorites: true } },
    },
  });

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  if (user.profileVisibility === "private") {
    return Response.json({
      id: user.id,
      walletAddress: user.walletAddress,
      displayName: user.displayName,
      avatar: user.avatar,
      isPrivate: true,
    });
  }

  return Response.json({
    id: user.id,
    walletAddress: user.walletAddress,
    displayName: user.displayName,
    avatar: user.avatar,
    bio: user.bio,
    showBetHistory: user.showBetHistory,
    showStats: user.showStats,
    favoritesCount: user._count.favorites,
    createdAt: user.createdAt.toISOString(),
    isPrivate: false,
  });
}
