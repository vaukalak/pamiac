import { randomBytes } from "node:crypto";
import { hashAgentToken } from "./tokens.ts";

const USER_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export const GOOGLE_LOGIN_INTERVAL_SECONDS = 3;
export const GOOGLE_LOGIN_EXPIRES_SECONDS = 600;

export function googleAgentName(value: unknown) {
  if (typeof value !== "string") return "agent";
  const trimmed = value.trim().slice(0, 40);
  return trimmed || "agent";
}

export function googleTokenName(agent: string) {
  return `Google · ${agent}`;
}

export function googleConnectPath(userCode: string) {
  return `/connect/google?user_code=${encodeURIComponent(userCode)}`;
}

export function googleVerificationUrl(origin: string, userCode: string) {
  return `${origin.replace(/\/$/, "")}${googleConnectPath(userCode)}`;
}

export function createDeviceCode() {
  return randomBytes(32).toString("base64url");
}

export function createUserCode() {
  const bytes = randomBytes(8);
  let raw = "";
  for (let index = 0; index < 8; index += 1) {
    raw += USER_CODE_ALPHABET[bytes[index]! % USER_CODE_ALPHABET.length];
  }
  return formatUserCode(raw);
}

export function formatUserCode(raw: string) {
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
}

export function normalizeUserCode(value: string) {
  const compact = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (compact.length !== 8) return null;
  if ([...compact].some((character) => !USER_CODE_ALPHABET.includes(character))) return null;
  return formatUserCode(compact);
}

export function hashGoogleCode(value: string) {
  return hashAgentToken(value);
}

export interface GoogleLoginRow {
  deniedAt: Date | null;
  expiresAt: Date;
  userId: string | null;
  tokenSecret: string | null;
}

export function googleLoginPoll(row: GoogleLoginRow | null, now: number) {
  if (!row) return { status: "invalid" as const };
  if (row.deniedAt) return { status: "denied" as const };
  if (row.tokenSecret) return { status: "ready" as const };
  if (row.expiresAt.getTime() <= now) return { status: "expired" as const };
  if (row.userId) return { status: "expired" as const };
  return { status: "pending" as const };
}

export function googleLoginHttpStatus(status: ReturnType<typeof googleLoginPoll>["status"]) {
  if (status === "invalid") return 404;
  if (status === "denied") return 403;
  if (status === "expired") return 410;
  return 200;
}
