const CURSOR_NATIVE_CALLBACK = "cursor://anysphere.cursor-mcp/oauth/callback";

const NATIVE_HTTP_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasCredentialsOrFragment(uri: string, url: URL) {
  return uri.includes("#") || url.username.length > 0 || url.password.length > 0;
}

function isDottedLoopback(host: string) {
  const parts = host.split(".");
  if (parts.length !== 4) return false;
  const octets = parts.map((part) => (/^\d{1,3}$/.test(part) ? Number(part) : Number.NaN));
  if (octets.some((octet) => !Number.isInteger(octet) || octet > 255)) return false;
  return octets[0] === 127;
}

function isLoopbackHostname(hostname: string) {
  const bare =
    hostname.startsWith("[") && hostname.endsWith("]") ? hostname.slice(1, -1) : hostname;
  const host = bare.toLowerCase().split("%")[0] ?? "";
  if (host === "::1" || host === "0:0:0:0:0:0:0:1") return true;
  if (isDottedLoopback(host)) return true;
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(host);
  if (mapped?.[1] && isDottedLoopback(mapped[1])) return true;
  const mappedHex = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(host);
  if (!mappedHex?.[1] || !mappedHex[2]) return false;
  const high = Number.parseInt(mappedHex[1], 16);
  const low = Number.parseInt(mappedHex[2], 16);
  const address = `${(high >>> 8) & 0xff}.${high & 0xff}.${(low >>> 8) & 0xff}.${low & 0xff}`;
  return isDottedLoopback(address);
}

function rawHttpAuthorityHost(uri: string) {
  const authority = /^http:\/\/([^/?#]*)/i.exec(uri)?.[1];
  if (!authority || authority.includes("@")) return null;
  if (authority.startsWith("[")) {
    const bracketEnd = authority.indexOf("]");
    if (bracketEnd < 0) return null;
    const rest = authority.slice(bracketEnd + 1);
    if (rest !== "" && !/^:\d+$/.test(rest)) return null;
    return authority.slice(0, bracketEnd + 1).toLowerCase();
  }
  const colon = authority.indexOf(":");
  if (colon < 0) return authority.toLowerCase();
  if (!/^\d+$/.test(authority.slice(colon + 1))) return null;
  return authority.slice(0, colon).toLowerCase();
}

export function isNativeAcceptableRedirectUri(uri: string) {
  if (uri === CURSOR_NATIVE_CALLBACK) return true;
  let url: URL;
  try {
    url = new URL(uri);
  } catch {
    return false;
  }
  if (hasCredentialsOrFragment(uri, url)) return false;
  if (url.protocol === "https:") {
    return url.hostname !== "localhost" && !isLoopbackHostname(url.hostname);
  }
  if (url.protocol !== "http:") return false;
  const host = rawHttpAuthorityHost(uri);
  return host !== null && NATIVE_HTTP_HOSTS.has(host);
}

export function isWebAcceptableRedirectUri(uri: string) {
  let url: URL;
  try {
    url = new URL(uri);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || hasCredentialsOrFragment(uri, url)) return false;
  return url.hostname !== "localhost" && !isLoopbackHostname(url.hostname);
}

export function rewriteNativeRegistrationBody(body: Uint8Array) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(body));
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;
  if (parsed.application_type !== undefined && parsed.application_type !== "web") return null;
  const redirectUris = parsed.redirect_uris;
  if (!Array.isArray(redirectUris) || redirectUris.length === 0) return null;
  if (!redirectUris.every((uri) => typeof uri === "string")) return null;
  const uris = redirectUris as string[];
  if (!uris.every((uri) => isNativeAcceptableRedirectUri(uri))) return null;
  if (!uris.some((uri) => !isWebAcceptableRedirectUri(uri))) return null;
  return new TextEncoder().encode(JSON.stringify({ ...parsed, application_type: "native" }));
}

function isOauthRegisterPost(request: Request) {
  if (request.method !== "POST") return false;
  return new URL(request.url).pathname.endsWith("/oauth2/register");
}

function registrationHeaders(request: Request, body: Uint8Array) {
  const headers = new Headers(request.headers);
  headers.delete("transfer-encoding");
  headers.delete("connection");
  headers.delete("keep-alive");
  headers.set("content-length", String(body.byteLength));
  return headers;
}

export async function prepareOauthRegisterRequest(request: Request) {
  if (!isOauthRegisterPost(request)) return request;
  const original = new Uint8Array(await request.arrayBuffer());
  const rewritten = rewriteNativeRegistrationBody(original);
  const body = rewritten ?? original;
  const init: RequestInit & { duplex: "half" } = {
    method: "POST",
    headers: registrationHeaders(request, body),
    body,
    duplex: "half",
  };
  return new Request(request.url, init);
}
