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
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      banner: user.banner,
      bio: user.bio,
      email: user.email,
      authProvider: user.authProvider,
      createdAt: user.createdAt.toISOString(),
      isTipster: user.isTipster,
      whopBusinessId: user.whopBusinessId,
    },
  });
}
