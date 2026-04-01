"use client";

let magicInstance: any = null;

export async function getMagic() {
  if (typeof window === "undefined") {
    throw new Error("Magic SDK can only be initialized in the browser");
  }

  if (magicInstance) return magicInstance;

  const key = process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY;
  if (!key) throw new Error("NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY is not set");

  /* eslint-disable @typescript-eslint/no-require-imports */
  const { Magic } = require("magic-sdk");
  const { OAuthExtension } = require("@magic-ext/oauth");
  /* eslint-enable @typescript-eslint/no-require-imports */

  magicInstance = new Magic(key, {
    network: {
      rpcUrl: "https://polygon-bor-rpc.publicnode.com",
      chainId: 137,
    },
    extensions: [new OAuthExtension()],
  });

  return magicInstance;
}
