import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { generatePrivateKey, privateKeyToAddress } from "viem/accounts";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.EMBEDDED_WALLET_ENCRYPTION_KEY;
  if (!key) throw new Error("EMBEDDED_WALLET_ENCRYPTION_KEY not set");
  // Key should be 32 bytes hex-encoded (64 hex chars)
  return Buffer.from(key, "hex");
}

export function generateEmbeddedWallet(): {
  address: string;
  encryptedKey: string;
} {
  const privateKey = generatePrivateKey();
  const address = privateKeyToAddress(privateKey).toLowerCase();
  const encryptedKey = encryptWalletKey(privateKey);
  return { address, encryptedKey };
}

function encryptWalletKey(privateKey: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(privateKey, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  // Format: iv:tag:ciphertext (all hex)
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptWalletKey(encryptedKey: string): string {
  const key = getEncryptionKey();
  const [ivHex, tagHex, ciphertextHex] = encryptedKey.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const ciphertext = Buffer.from(ciphertextHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
