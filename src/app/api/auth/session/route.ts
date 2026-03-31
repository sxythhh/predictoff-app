export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);

  if (!user) {
    return Response.json({ user: null });
  }

  return Response.json({
    user: {
      id: user.id,
      walletAddress: user.walletAddress,
      displayName: user.displayName,
      avatar: user.avatar,
      bio: user.bio,
      authProvider: user.authProvider,
      createdAt: user.createdAt.toISOString(),
    },
  });
}
