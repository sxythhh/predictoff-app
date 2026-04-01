export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/auth";
import { getMagicAdmin } from "@/lib/magic-admin";

export async function POST(request: NextRequest) {
  try {
    const { didToken } = await request.json();

    if (!didToken) {
      return Response.json({ error: "Missing DID token" }, { status: 400 });
    }

    // Verify DID token server-side (cryptographic proof from Magic)
    const magicAdmin = getMagicAdmin();
    try {
      magicAdmin.token.validate(didToken);
    } catch (err) {
      console.error("Magic DID token validation failed:", err);
      return Response.json({ error: "Invalid or expired DID token" }, { status: 401 });
    }

    // Extract verified metadata
    const metadata = await magicAdmin.users.getMetadataByToken(didToken);
    const email = metadata.email;
    const magicWalletAddress = metadata.publicAddress?.toLowerCase();

    if (!email || !magicWalletAddress) {
      return Response.json({ error: "Could not retrieve user metadata" }, { status: 400 });
    }

    // Atomically check email uniqueness and upsert user
    let user;
    try {
      user = await prisma.$transaction(async (tx) => {
        const existingByEmail = await tx.user.findUnique({ where: { email } });
        if (existingByEmail && existingByEmail.walletAddress !== magicWalletAddress) {
          throw new Error("EMAIL_CONFLICT");
        }

        // Delete any existing sessions for this user (prevent accumulation)
        const existingUser = await tx.user.findUnique({ where: { walletAddress: magicWalletAddress } });
        if (existingUser) {
          await tx.session.deleteMany({ where: { userId: existingUser.id } });
        }

        return tx.user.upsert({
          where: { walletAddress: magicWalletAddress },
          update: { email, authProvider: "magic" },
          create: { walletAddress: magicWalletAddress, email, authProvider: "magic" },
        });
      });
    } catch (err) {
      if (err instanceof Error && err.message === "EMAIL_CONFLICT") {
        return Response.json(
          { error: "This email is already linked to another account" },
          { status: 409 }
        );
      }
      throw err;
    }

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
        banner: user.banner,
        bio: user.bio,
        email: user.email,
        authProvider: user.authProvider,
      },
    });

    // Set session cookie
    response.headers.set(
      "Set-Cookie",
      `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`
    );

    return response;
  } catch (err) {
    console.error("Magic verify error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: "Verification failed", detail: msg }, { status: 500 });
  }
}
