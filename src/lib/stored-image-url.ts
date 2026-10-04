const IMAGE_KEY = /^[0-9a-f]{32}\.(jpg|png|webp|gif)$/;

const IMAGE_CONTENT_TYPE: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

const R2_URL = /https:\/\/[a-z0-9.-]+\.r2\.cloudflarestorage\.com\/[^\s<>)"']+/g;

export function isR2StorageHost(host: string) {
  return host.endsWith(".r2.cloudflarestorage.com");
}

export function imageObjectContentType(key: string) {
  const match = IMAGE_KEY.exec(key);
  const extension = match?.[1];
  if (!extension) return null;
  return IMAGE_CONTENT_TYPE[extension] ?? null;
}

export function isImageObjectKey(key: string) {
  return imageObjectContentType(key) !== null;
}

function rewriteR2ImageUrl(value: string) {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return value;
  }
  if (parsed.protocol !== "https:") return value;
  if (!isR2StorageHost(parsed.hostname)) return value;
  const segments = parsed.pathname.split("/").filter((segment) => segment.length > 0);
  if (segments.length !== 1 && segments.length !== 2) return value;
  let key = segments[segments.length - 1] ?? "";
  try {
    key = decodeURIComponent(key);
  } catch {
    return value;
  }
  if (!isImageObjectKey(key)) return value;
  return `/i/${key}`;
}

export function rewriteStoredR2Images(markdown: string) {
  return markdown.replace(R2_URL, (raw) => {
    const trimmed = raw.replace(/[.,;:!?]+$/, "");
    const suffix = raw.slice(trimmed.length);
    const rewritten = rewriteR2ImageUrl(trimmed);
    if (rewritten === trimmed) return raw;
    return `${rewritten}${suffix}`;
  });
}
