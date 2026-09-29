export function appSecret() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("BETTER_AUTH_SECRET is required");
  }
  return "dev-only-pamiac-secret-change-me";
}

export function appBaseUrl() {
  return (process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

const CONTROL_CHARACTER = /[\u0000-\u001f\u007f-\u009f]/;
const ENCODED_PATH_SEPARATOR = /%2f|%5c/i;

/** A same-app path: one leading slash, no protocol-relative or external URL. */
export function isSafeRelativePath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return false;
  if (CONTROL_CHARACTER.test(value)) return false;
  const pathEnd = value.search(/[?#]/);
  const path = pathEnd === -1 ? value : value.slice(0, pathEnd);
  if (ENCODED_PATH_SEPARATOR.test(path)) return false;
  try {
    return new URL(value, "https://pamiac.invalid").origin === "https://pamiac.invalid";
  } catch {
    return false;
  }
}

export function safeNext(value: string | null | undefined) {
  if (!value || !isSafeRelativePath(value)) return "/workspace";
  return value;
}

export const MAX_CONTENT_LENGTH = 500_000;
