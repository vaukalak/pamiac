export function sitemapEntries(base: string) {
  const origin = base.replace(/\/$/, "");
  return ["/", "/privacy", "/terms", "/support"].map((path) => ({
    url: path === "/" ? origin : `${origin}${path}`,
  }));
}
