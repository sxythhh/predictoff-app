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

  const select = {
    id: true,
    walletAddress: true,
    username: true,
    displayName: true,
    avatar: true,
    bio: true,
    profileVisibility: true,
    showBetHistory: true,
    showStats: true,
    isTipster: true,
    tipsterBio: true,
    subscriptionPrice: true,
    createdAt: true,
    _count: { select: { favorites: true, tipsterPicks: true, subscribers: true } },
  } as const;

  // Try wallet address first, then username
  const isWalletAddress = /^0x[a-fA-F0-9]{40}$/.test(address);
  const user = isWalletAddress
    ? await prisma.user.findUnique({ where: { walletAddress: normalized }, select })
    : await prisma.user.findUnique({ where: { username: normalized }, select });

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  if (user.profileVisibility === "private") {
    return Response.json({
      id: user.id,
      walletAddress: user.walletAddress,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      isPrivate: true,
    });
  }

  return Response.json({
    id: user.id,
    walletAddress: user.walletAddress,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    bio: user.bio,
    showBetHistory: user.showBetHistory,
    showStats: user.showStats,
    favoritesCount: user._count.favorites,
    isTipster: user.isTipster,
    tipsterBio: user.tipsterBio,
    subscriptionPrice: user.subscriptionPrice,
    totalPicks: user._count.tipsterPicks,
    subscriberCount: user._count.subscribers,
    createdAt: user.createdAt.toISOString(),
    isPrivate: false,
  });
}
