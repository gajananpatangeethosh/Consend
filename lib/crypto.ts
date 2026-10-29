import crypto from "crypto";

/**
 * Encrypt a buffer or UTF-8 string with AES-256-GCM
 */
export function encryptAES256GCM(
  data: Buffer | string,
  keyHex?: string
): {
  ciphertextBase64: string;
  ivHex: string;
  authTagHex: string;
  keyHex: string;
  hashSha256: string;
} {
  const key = keyHex ? Buffer.from(keyHex, "hex") : crypto.randomBytes(32);
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const bufferData = Buffer.isBuffer(data) ? data : Buffer.from(data, "utf8");

  const encrypted = Buffer.concat([cipher.update(bufferData), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const hashSha256 = crypto.createHash("sha256").update(encrypted).digest("hex");

  return {
    ciphertextBase64: encrypted.toString("base64"),
    ivHex: iv.toString("hex"),
    authTagHex: authTag.toString("hex"),
    keyHex: key.toString("hex"),
    hashSha256,
  };
}

/**
 * Decrypt AES-256-GCM ciphertext
 */
export function decryptAES256GCM(
  ciphertextBase64: string,
  keyHex: string,
  ivHex: string,
  authTagHex: string
): Buffer {
  const key = Buffer.from(keyHex, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(ciphertextBase64, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

/**
 * Generate cryptographically secure request token and its SHA-256 hash
 */
export function generateSecureToken(): { plainToken: string; tokenHash: string } {
  const plainToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(plainToken).digest("hex");
  return { plainToken, tokenHash };
}

/**
 * Hash a plain token for verification
 */
export function hashToken(plainToken: string): string {
  return crypto.createHash("sha256").update(plainToken).digest("hex");
}
