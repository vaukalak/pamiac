export async function sitemapForNotes(base: string, readNoteIds: () => Promise<readonly string[]>) {
  if (!process.env.DATABASE_URL) return sitemapEntries(base, []);
  try {
    return sitemapEntries(base, await readNoteIds());
  } catch {
    return sitemapEntries(base, []);
  }
}

export function sitemapEntries(base: string, noteIds: readonly string[]) {
  const origin = base.replace(/\/$/, "");
  const pages = ["/", "/privacy", "/terms", "/support"].map((path) => ({
    url: path === "/" ? origin : `${origin}${path}`,
  }));
  const notes = noteIds.map((id) => ({
    url: `${origin}/d/${encodeURIComponent(id)}`,
  }));
  return [...pages, ...notes];
}
