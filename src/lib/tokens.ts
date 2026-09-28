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
