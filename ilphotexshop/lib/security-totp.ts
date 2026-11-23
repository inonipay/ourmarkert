import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from "node:crypto";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function createTotpSecret(length = 32) {
  const bytes = randomBytes(length);
  let bits = "";
  for (const byte of bytes) bits += byte.toString(2).padStart(8, "0");
  let secret = "";
  for (let index = 0; index + 5 <= bits.length && secret.length < 32; index += 5) {
    secret += alphabet.slice(Number.parseInt(bits.slice(index, index + 5), 2), Number.parseInt(bits.slice(index, index + 5), 2) + 1);
  }
  return secret;
}

function base32Decode(secret: string) {
  const normalized = secret.toUpperCase().replace(/=+$/, "");
  let bits = "";
  for (const character of normalized) {
    const value = alphabet.indexOf(character);
    if (value < 0) throw new Error("Invalid TOTP secret");
    bits += value.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
  }
  return Buffer.from(bytes);
}

export function verifyTotp(secret: string, code: string, at = Date.now()) {
  if (!/^[0-9]{6}$/.test(code)) return false;
  const counter = Math.floor(at / 30000);
  for (const offset of [-1, 0, 1]) {
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64BE(BigInt(counter + offset));
    const digest = createHmac("sha1", base32Decode(secret)).update(buffer).digest();
    const position = digest[digest.length - 1]! & 15;
    const binary =
      ((digest[position]! & 127) << 24) |
      ((digest[position + 1]! & 255) << 16) |
      ((digest[position + 2]! & 255) << 8) |
      (digest[position + 3]! & 255);
    const candidate = (binary >>> 0) % 1000000;
    if (candidate.toString().padStart(6, "0") === code) return true;
  }
  return false;
}

function getEncryptionKey() {
  const configured = process.env.SECURITY_TOTP_ENCRYPTION_KEY;
  if (!configured) {
    throw new Error("SECURITY_TOTP_ENCRYPTION_KEY is not configured");
  }
  const key = Buffer.from(configured, "base64");
  if (key.length !== 32 || key.toString("base64") !== configured) {
    throw new Error("SECURITY_TOTP_ENCRYPTION_KEY must be a base64-encoded 32-byte key");
  }
  return key;
}

export function encryptTotpSecret(secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(secret, "utf8"),
    cipher.final(),
  ]);
  return `v1:${iv.toString("hex")}:${cipher.getAuthTag().toString("hex")}:${ciphertext.toString("hex")}`;
}

export function decryptTotpSecret(encrypted: string) {
  const [version, ivHex, tagHex, ciphertextHex, ...extra] = encrypted.split(":");
  if (
    version !== "v1" ||
    !ivHex ||
    !tagHex ||
    !ciphertextHex ||
    extra.length > 0 ||
    !/^[0-9a-f]{24}$/i.test(ivHex) ||
    !/^[0-9a-f]{32}$/i.test(tagHex) ||
    !/^[0-9a-f]+$/i.test(ciphertextHex)
  ) {
    throw new Error("Stored TOTP secret is invalid");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivHex, "hex"),
  );
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}
