import { appBaseUrl } from "./config.ts";

export function robotsPolicy() {
  const base = appBaseUrl();
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/privacy", "/terms", "/support", "/d/"],
      disallow: [
        "/login",
        "/profile",
        "/workspace",
        "/oauth",
        "/connect",
        "/f/",
        "/api/",
        "/.well-known/",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
