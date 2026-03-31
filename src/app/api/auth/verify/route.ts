export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { SiweMessage } from "siwe";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { message, signature } = await request.json();

    if (!message || !signature) {
      return Response.json({ error: "Missing message or signature" }, { status: 400 });
    }

    const siweMessage = new SiweMessage(message);
    const result = await siweMessage.verify({ signature });

    if (!result.success) {
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }

    const address = result.data.address.toLowerCase();

    // Upsert user
    const user = await prisma.user.upsert({
      where: { walletAddress: address },
      update: {},
      create: { walletAddress: address },
    });

    // Create session (30 days)
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: { userId: user.id, token, expiresAt },
    });

    const response = Response.json({
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        displayName: user.displayName,
        avatar: user.avatar,
        bio: user.bio,
      },
    });

    // Set session cookie
    response.headers.set(
      "Set-Cookie",
      `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`
    );

    return response;
  } catch (err) {
    console.error("SIWE verify error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: "Verification failed", detail: msg }, { status: 500 });
  }
}
