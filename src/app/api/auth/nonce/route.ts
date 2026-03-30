export const dynamic = "force-dynamic";
import { randomBytes } from "crypto";

// In-memory nonce store (works for single-instance dev; use Redis for prod)
const nonceStore = new Map<string, { nonce: string; expiresAt: number }>();

export async function GET() {
  const nonce = randomBytes(16).toString("hex");
  // Store with 5-minute expiry
  nonceStore.set(nonce, { nonce, expiresAt: Date.now() + 5 * 60 * 1000 });

  // Clean expired nonces
  for (const [key, val] of nonceStore) {
    if (val.expiresAt < Date.now()) nonceStore.delete(key);
  }

  return Response.json({ nonce });
}

export { nonceStore };
