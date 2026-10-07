import { appBaseUrl } from "./config.ts";

export function robotsPolicy() {
  const base = appBaseUrl();
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/privacy", "/terms", "/support"],
      disallow: [
        "/login",
        "/profile",
        "/workspace",
        "/oauth",
        "/connect",
        "/f/",
        "/api/",
        "/.well-known/",
        "/d/",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
