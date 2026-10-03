export function requestOrigin(request: {
  headers: { get(name: string): string | null };
  url: string;
}) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;
  return new URL(request.url).origin;
}

export function presentListedDocument(
  document: {
    id: string;
    type: string;
    title: string;
    updatedAt: Date;
    folderId?: string | null;
  },
  origin: string,
) {
  return {
    id: document.id,
    type: document.type,
    title: document.title,
    url: `${origin}/d/${document.id}`,
    updatedAt: document.updatedAt.toISOString(),
    folderId: document.folderId ?? null,
  };
}

export function presentSearchHit(
  presented: { id: string; type: string; title: string; url: string; excerpt: string },
  score: number,
) {
  return {
    id: presented.id,
    type: presented.type,
    title: presented.title,
    url: presented.url,
    score,
    excerpt: presented.excerpt,
  };
}

export function presentReadableDocument<T extends { updatedAt: Date }>(document: T) {
  return {
    ...document,
    updatedAt: document.updatedAt.toISOString(),
  };
}
