import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function createAgentToken() {
  const token = `pam_${randomBytes(32).toString("base64url")}`;
  return {
    token,
    tokenHash: hashAgentToken(token),
    tokenPrefix: token.slice(0, 12),
  };
}

export function hashAgentToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function tokenHashesMatch(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

const PRESET_DAYS = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1y": 365,
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;

export function resolveTokenExpiration(input: unknown, now: Date = new Date()): Date | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Invalid expiration");
  }
  const value = input as Record<string, unknown>;
  const hasPreset = "preset" in value;
  const hasDate = "date" in value;
  if (hasPreset === hasDate) throw new Error("Invalid expiration");
  if (hasPreset) return expirationFromPreset(value.preset, now);
  if (typeof value.date !== "string") throw new Error("Invalid expiration");
  return expirationFromDate(value.date, now);
}

function expirationFromPreset(preset: unknown, now: Date) {
  if (preset === "never") return null;
  if (preset === "7d" || preset === "30d" || preset === "90d" || preset === "1y") {
    return new Date(now.getTime() + PRESET_DAYS[preset] * DAY_MS);
  }
  throw new Error("Invalid expiration");
}

function expirationFromDate(date: string, now: Date) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new Error("Invalid expiration");
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const expiresAt = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
  if (
    expiresAt.getUTCFullYear() !== year ||
    expiresAt.getUTCMonth() !== month - 1 ||
    expiresAt.getUTCDate() !== day
  ) {
    throw new Error("Invalid expiration");
  }
  if (expiresAt.getTime() <= now.getTime()) {
    throw new Error("Expiration must be in the future");
  }
  return expiresAt;
}
