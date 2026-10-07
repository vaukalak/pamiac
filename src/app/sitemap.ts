import type { MetadataRoute } from "next";
import { appBaseUrl } from "@/lib/config";
import { sitemapEntries } from "@/lib/sitemap-entries";

export const revalidate = 3600;

export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapEntries(appBaseUrl());
}
