/**
 * AES-256-GCM encryption for sensitive data at rest (API keys).
 * Uses ENCRYPTION_KEY env var (32 bytes hex = 64 chars).
 * Falls back to plaintext if key not set (dev mode).
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;

function getKey(): Buffer | null {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) return null;
  return Buffer.from(hex, 'hex');
}

/**
 * Encrypt plaintext → "iv:ciphertext:tag" (hex encoded).
 * Returns plaintext unchanged if ENCRYPTION_KEY not set.
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  if (!key) return plaintext;

  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${encrypted.toString('hex')}:${tag.toString('hex')}`;
}

/**
 * Decrypt "iv:ciphertext:tag" → plaintext.
 * Returns input unchanged if not in encrypted format or key not set.
 */
export function decrypt(data: string): string {
  const key = getKey();
  if (!key) return data;

  const parts = data.split(':');
  if (parts.length !== 3) return data; // not encrypted, return as-is

  const [ivHex, encHex, tagHex] = parts;
  try {
    const iv = Buffer.from(ivHex!, 'hex');
    const encrypted = Buffer.from(encHex!, 'hex');
    const tag = Buffer.from(tagHex!, 'hex');

    if (iv.length !== IV_LEN || tag.length !== TAG_LEN) return data;

    const decipher = createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    return data; // decryption failed, return as-is (might be plaintext from before encryption was enabled)
  }
}
