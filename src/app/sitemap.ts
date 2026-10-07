import type { MetadataRoute } from "next";
import { appBaseUrl } from "@/lib/config";
import { listPublicNoteIds } from "@/lib/documents";
import { sitemapForNotes } from "@/lib/sitemap-entries";

export const revalidate = 3600;

export default function sitemap(): Promise<MetadataRoute.Sitemap> {
  return sitemapForNotes(appBaseUrl(), listPublicNoteIds);
}
