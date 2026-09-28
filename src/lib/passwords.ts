import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash || hash.length !== 64) return false;
  const next = scryptSync(password, salt, 32);
  const current = Buffer.from(hash, "hex");
  if (next.length !== current.length) return false;
  return timingSafeEqual(next, current);
}

export function signUnlock(documentId: string, passwordHash: string, secret: string): string {
  return createHmac("sha256", secret).update(`${documentId}:${passwordHash}`).digest("hex");
}

export function unlockCookieName(documentId: string): string {
  return `pamiac_unlock_${documentId}`;
}

export function unlockMatches(
  cookieValue: string | undefined,
  documentId: string,
  passwordHash: string,
  secret: string,
): boolean {
  if (!cookieValue) return false;
  const expected = signUnlock(documentId, passwordHash, secret);
  const left = Buffer.from(cookieValue);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
