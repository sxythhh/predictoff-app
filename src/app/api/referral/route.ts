export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

function generateCode(length = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// GET /api/referral — get current user's referral info
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Ensure user has a referral code
  let referralCode = user.referralCode;
  if (!referralCode) {
    // Generate unique code
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateCode();
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { referralCode: code },
        });
        referralCode = code;
        break;
      } catch {
        // Code collision, retry
        continue;
      }
    }
  }

  // Get referral stats
  const referrals = await prisma.referral.findMany({
    where: { referrerId: user.id },
    include: {
      referred: {
        select: {
          id: true,
          displayName: true,
          walletAddress: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({
    referralCode,
    totalReferrals: referrals.length,
    referrals: referrals.map((r) => ({
      id: r.id,
      displayName: r.referred.displayName,
      walletAddress: r.referred.walletAddress.slice(0, 6) + "..." + r.referred.walletAddress.slice(-4),
      joinedAt: r.createdAt.toISOString(),
    })),
  });
}

// POST /api/referral { code } — apply referral code for current user
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user already has a referrer
  const existing = await prisma.referral.findUnique({
    where: { referredId: user.id },
  });
  if (existing) {
    return Response.json({ error: "Already referred" }, { status: 400 });
  }

  const { code } = await request.json();
  if (!code || typeof code !== "string") {
    return Response.json({ error: "Invalid code" }, { status: 400 });
  }

  // Find referrer by code
  const referrer = await prisma.user.findFirst({
    where: { referralCode: code },
  });
  if (!referrer) {
    return Response.json({ error: "Invalid referral code" }, { status: 404 });
  }

  // Can't refer yourself
  if (referrer.id === user.id) {
    return Response.json({ error: "Cannot refer yourself" }, { status: 400 });
  }

  // Create referral
  await prisma.referral.create({
    data: {
      referrerId: referrer.id,
      referredId: user.id,
      referralCode: code,
    },
  });

  return Response.json({ success: true });
}
