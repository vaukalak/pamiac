import { randomBytes } from "node:crypto";
import { appBaseUrl } from "./config.ts";

const CONNECT_TTL_MS = 15 * 60 * 1000;
const CONTROL_CHARACTER = /[\u0000-\u001f\u007f-\u009f]/;

export type ConnectClaim = "pending" | "ready" | "consumed" | "expired";

export interface ConnectSnapshot {
  secret: string | null;
  claimedAt: Date | null;
  expiresAt: Date;
}

export function createConnectId() {
  return `con_${randomBytes(32).toString("base64url")}`;
}

export function connectExpiresAt(now: Date) {
  return new Date(now.getTime() + CONNECT_TTL_MS);
}

export function agentName(input: string) {
  const name = input.trim();
  if (name.length < 1 || name.length > 80) {
    throw new Error("Agent name must be between 1 and 80 characters");
  }
  if (CONTROL_CHARACTER.test(name)) {
    throw new Error("Agent name cannot include control characters");
  }
  return name;
}

export function connectUrl(id: string) {
  return `${appBaseUrl()}/connect/${id}`;
}

function secretPresent(secret: string | null) {
  return secret !== null && secret.length > 0;
}

export function claimResult(row: ConnectSnapshot, now: Date): ConnectClaim {
  if (row.claimedAt) return "consumed";
  if (row.expiresAt.getTime() <= now.getTime()) return "expired";
  if (secretPresent(row.secret)) return "ready";
  return "pending";
}
