import { readableBlockMarkdown } from "./block-link.ts";
import { MAX_CONTENT_LENGTH } from "./config.ts";
import { noteMarkdown } from "./note-blocks.ts";

const maxTitleLength = 160;

export function markdownImportTitle(fileName: string) {
  const base = fileName.replace(/\.md$/i, "").trim();
  const title = base || "Untitled note";
  return title.slice(0, maxTitleLength);
}

export function duplicateNoteTitle(title: string) {
  const trimmed = title.trim() || "Untitled note";
  const suffix = " copy";
  if (trimmed.length + suffix.length <= maxTitleLength) return `${trimmed}${suffix}`;
  return `${trimmed.slice(0, maxTitleLength - suffix.length).trimEnd()}${suffix}`;
}

export function markdownFileName(title: string) {
  const cleaned = title
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/[\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  const base = cleaned || "note";
  return `${base}.md`;
}

export function noteExportMarkdown(content: string) {
  return readableBlockMarkdown(noteMarkdown(content));
}

export interface MarkdownDropFile {
  name: string;
  size: number;
}

export function markdownDropChoice(files: readonly MarkdownDropFile[]) {
  if (files.length === 0) return { status: "ignore" } as const;
  const index = files.findIndex((file) => file.name.toLowerCase().endsWith(".md"));
  if (index < 0) return { status: "error", message: "Drop a Markdown file." } as const;
  const file = files[index];
  if (!file || file.size <= 0) {
    return { status: "error", message: "That Markdown file is empty." } as const;
  }
  if (file.size > MAX_CONTENT_LENGTH) {
    return { status: "error", message: "That Markdown file is too large." } as const;
  }
  return { status: "ready", index, title: markdownImportTitle(file.name) } as const;
}

export function markdownTextError(text: string) {
  if (!text.trim()) return "That Markdown file is empty.";
  if (text.length > MAX_CONTENT_LENGTH) return "That Markdown file is too large.";
  return null;
}
