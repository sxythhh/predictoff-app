"use client";

import { Magic } from "magic-sdk";

let magicInstance: Magic | null = null;

export function getMagic(): Magic {
  if (typeof window === "undefined") {
    throw new Error("Magic SDK can only be initialized in the browser");
  }

  if (magicInstance) return magicInstance;

  const key = process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY;
  if (!key) throw new Error("NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY is not set");

  magicInstance = new Magic(key, {
    network: {
      rpcUrl: "https://polygon-bor-rpc.publicnode.com",
      chainId: 137,
    },
  });

  return magicInstance;
}
