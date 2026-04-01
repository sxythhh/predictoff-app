import { Magic } from "@magic-sdk/admin";

let adminInstance: InstanceType<typeof Magic> | null = null;

export function getMagicAdmin() {
  if (adminInstance) return adminInstance;

  const secretKey = process.env.MAGIC_SECRET_KEY;
  if (!secretKey) throw new Error("MAGIC_SECRET_KEY is not set");

  adminInstance = new Magic(secretKey);
  return adminInstance;
}
