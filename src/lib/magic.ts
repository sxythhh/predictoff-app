"use client";

let magicInstance: any = null;
let loadPromise: Promise<void> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

async function ensureLoaded() {
  if ((window as any).Magic) return;
  if (!loadPromise) {
    loadPromise = (async () => {
      await loadScript("https://cdn.jsdelivr.net/npm/magic-sdk@28/dist/magic.js");
      await loadScript("https://cdn.jsdelivr.net/npm/@magic-ext/oauth@18/dist/extension.js");
    })();
  }
  await loadPromise;
}

export async function getMagic() {
  if (typeof window === "undefined") {
    throw new Error("Magic SDK can only be initialized in the browser");
  }

  if (magicInstance) return magicInstance;

  const key = process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY;
  if (!key) throw new Error("NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY is not set");

  await ensureLoaded();

  const Magic = (window as any).Magic;
  const OAuthExtension = (window as any).MagicOAuthExtension?.OAuthExtension
    ?? (window as any).MagicOAuthExtension;

  if (!Magic) throw new Error("Magic SDK failed to load");

  const extensions = OAuthExtension ? [new OAuthExtension()] : [];

  magicInstance = new Magic(key, {
    network: {
      rpcUrl: "https://polygon-bor-rpc.publicnode.com",
      chainId: 137,
    },
    extensions,
  });

  return magicInstance;
}
