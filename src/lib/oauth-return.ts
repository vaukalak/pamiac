import { isSafeRelativePath } from "./config.ts";

const AUTHORIZE_KEYS = [
  "response_type",
  "client_id",
  "redirect_uri",
  "scope",
  "state",
  "code_challenge",
  "code_challenge_method",
  "resource",
  "nonce",
  "prompt",
  "claims",
  "max_age",
  "response_mode",
] as const;

export function toSearchParams(params: Record<string, string | string[] | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") search.append(key, value);
    else if (Array.isArray(value)) {
      for (const item of value) search.append(key, item);
    }
  }
  return search;
}

export function isOAuthLoginQuery(params: URLSearchParams) {
  return Boolean(params.get("sig") && params.get("client_id") && params.get("response_type"));
}

export function oauthLoginReturnPath(params: URLSearchParams) {
  if (!isOAuthLoginQuery(params)) return null;
  const path = `/login?${params.toString()}`;
  if (!isSafeRelativePath(path)) return null;
  return path;
}

export function oauthAuthorizeResumePath(params: URLSearchParams) {
  if (!isOAuthLoginQuery(params)) return null;
  const next = new URLSearchParams();
  for (const key of AUTHORIZE_KEYS) {
    for (const value of params.getAll(key)) next.append(key, value);
  }
  if (!next.get("client_id") || !next.get("response_type")) return null;
  const path = `/api/auth/oauth2/authorize?${next.toString()}`;
  if (!isSafeRelativePath(path)) return null;
  return path;
}

export function oauthConsentReturnPath(params: URLSearchParams) {
  const path = params.size ? `/oauth/consent?${params.toString()}` : "/oauth/consent";
  if (!isSafeRelativePath(path)) return "/oauth/consent";
  return path;
}

export function consentLoginHref(params: URLSearchParams) {
  return `/login?next=${encodeURIComponent(oauthConsentReturnPath(params))}`;
}

export function oauthClientLabel(clientId: string) {
  const trimmed = clientId.trim();
  if (!trimmed) return "This application";
  try {
    return new URL(trimmed).hostname || trimmed;
  } catch {
    return trimmed;
  }
}

export function oauthRedirectTarget(value: unknown) {
  if (!value || typeof value !== "object" || !("url" in value)) return null;
  const url = value.url;
  if (typeof url !== "string" || !url) return null;
  if (isSafeRelativePath(url)) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") return parsed.toString();
  } catch {
    return null;
  }
  return null;
}
