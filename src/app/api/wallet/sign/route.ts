export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { decryptWalletKey } from "@/lib/embedded-wallet";
import { privateKeyToAccount } from "viem/accounts";

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user.embeddedWalletKey) {
    return Response.json(
      { error: "No embedded wallet for this user" },
      { status: 400 }
    );
  }

  try {
    const { message } = await request.json();
    if (!message || typeof message !== "string") {
      return Response.json({ error: "Missing message" }, { status: 400 });
    }

    const privateKey = decryptWalletKey(user.embeddedWalletKey) as `0x${string}`;
    const account = privateKeyToAccount(privateKey);
    const signature = await account.signMessage({ message });

    return Response.json({ signature });
  } catch (err) {
    console.error("Wallet sign error:", err);
    return Response.json({ error: "Signing failed" }, { status: 500 });
  }
}
