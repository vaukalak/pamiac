import { appBaseUrl } from "./config.ts";
import { readableBlockMarkdown } from "./block-link.ts";
import { defaultTitle } from "./content.ts";
import { excerpt } from "./embeddings.ts";
import { noteMarkdown } from "./note-blocks.ts";

export const SHARE_APP_TITLE = "Pamiac";
export const SHARE_GENERIC_TITLE = "A shared mind for you and your agents.";
export const SHARE_APP_DESCRIPTION =
  "UML diagrams and notes, with links you can share and a token agents can use.";
export const SHARE_EMPTY_NOTE = "Empty note";
export const SHARE_EXCERPT_LENGTH = 240;
export const SHARE_PREVIEW_LINE_LIMIT = 8;
export const SHARE_IMAGE_SIZE = { width: 1200, height: 630 };
export const SHARE_IMAGE_CONTENT_TYPE = "image/png";

const LINE_CLIP = 160;
const FENCE = /^(```|~~~)/;
const HEADING = /^(#{1,6})\s+(\S.*)$/;
const RULE = /^(-{3,}|\*{3,}|_{3,})$/;
const QUOTE = /^(?:>\s*)+/;
const LIST = /^(?:[-*+]|\d+[.)])\s+/;

export interface ShareDocument {
  title: string;
  content: string;
  type: string;
  visibility: string;
}

export interface SharePreviewLine {
  kind: "heading" | "text";
  level: number;
  text: string;
}

export interface SharePreview {
  publicNote: boolean;
  title: string;
  description: string;
  lines: SharePreviewLine[];
}

export function isPublicNoteShare(
  document: ShareDocument | null | undefined,
): document is ShareDocument {
  return document?.visibility === "public" && document.type === "note";
}

export function shareNoteTitle(title: string) {
  const trimmed = title.trim();
  return trimmed || defaultTitle("note");
}

export function noteShareMarkdown(content: string) {
  return readableBlockMarkdown(noteMarkdown(content));
}

export function noteShareExcerpt(content: string) {
  const prose = parseShareLines(noteShareMarkdown(content))
    .map((line) => line.text)
    .join(" ");
  return excerpt(prose, SHARE_EXCERPT_LENGTH) || SHARE_EMPTY_NOTE;
}

export function sharePreviewLines(content: string) {
  return parseShareLines(noteShareMarkdown(content))
    .slice(0, SHARE_PREVIEW_LINE_LIMIT)
    .map((line) => ({ ...line, text: clipLine(line.text) }));
}

export function sharePreviewFromDocument(document: ShareDocument | null | undefined): SharePreview {
  if (!isPublicNoteShare(document)) {
    return {
      publicNote: false,
      title: SHARE_APP_TITLE,
      description: SHARE_APP_DESCRIPTION,
      lines: [],
    };
  }

  const lines = sharePreviewLines(document.content);
  return {
    publicNote: true,
    title: shareNoteTitle(document.title),
    description: noteShareExcerpt(document.content),
    lines: lines.length > 0 ? lines : [{ kind: "text", level: 0, text: SHARE_EMPTY_NOTE }],
  };
}

export async function sharePreviewForId(
  id: string,
  readDocument: (documentId: string) => Promise<ShareDocument | null>,
) {
  if (!process.env.DATABASE_URL) return sharePreviewFromDocument(null);
  try {
    return sharePreviewFromDocument(await readDocument(id));
  } catch {
    return sharePreviewFromDocument(null);
  }
}

export function shareImageAlt(preview: SharePreview) {
  return preview.publicNote ? preview.title : SHARE_APP_TITLE;
}

export interface SharePageTarget {
  url: string;
  imagePath: string;
}

export function appShareTarget(): SharePageTarget {
  return {
    url: appBaseUrl(),
    imagePath: "/share-card.png",
  };
}

export function documentShareTarget(id: string): SharePageTarget {
  const documentPath = `/d/${encodeURIComponent(id)}`;
  return {
    url: `${appBaseUrl()}${documentPath}`,
    imagePath: `${documentPath}/share-card.png`,
  };
}

export function sharePageMetadata(preview: SharePreview, target: SharePageTarget) {
  const socialTitle = preview.publicNote ? preview.title : SHARE_GENERIC_TITLE;
  const imageUrl = new URL(target.imagePath, target.url).href;
  const image = {
    url: imageUrl,
    width: SHARE_IMAGE_SIZE.width,
    height: SHARE_IMAGE_SIZE.height,
    alt: shareImageAlt(preview),
    type: SHARE_IMAGE_CONTENT_TYPE,
  };

  return {
    title: preview.title,
    description: preview.description,
    openGraph: {
      title: socialTitle,
      description: preview.description,
      siteName: SHARE_APP_TITLE,
      type: preview.publicNote ? ("article" as const) : ("website" as const),
      url: target.url,
      images: [image],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: socialTitle,
      description: preview.description,
      images: [imageUrl],
    },
  };
}

function parseShareLines(markdown: string): SharePreviewLine[] {
  const rows = markdown.replace(/\r\n/g, "\n").split("\n");
  const lines: SharePreviewLine[] = [];
  let fence = false;

  for (const row of rows) {
    const trimmed = row.trim();
    if (FENCE.test(trimmed)) {
      fence = !fence;
      continue;
    }
    if (!trimmed) continue;
    if (fence) {
      lines.push({ kind: "text", level: 0, text: trimmed });
      continue;
    }
    if (RULE.test(trimmed)) continue;

    const heading = HEADING.exec(trimmed);
    if (heading) {
      const text = stripInline(heading[2]);
      if (!text) continue;
      lines.push({ kind: "heading", level: Math.min(heading[1].length, 3), text });
      continue;
    }

    const text = stripInline(trimmed.replace(QUOTE, "").replace(LIST, ""));
    if (!text) continue;
    lines.push({ kind: "text", level: 0, text });
  }

  return lines;
}

function stripInline(value: string) {
  const codes: string[] = [];
  const parked = value.replace(/`([^`]*)`/g, (_match, code: string) => {
    const token = `\u0000${codes.length}\u0000`;
    codes.push(code);
    return token;
  });
  const linked = parked
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\[[^\]]*\]/g, "$1")
    .replace(/<(https?:\/\/[^>\s]+)>/g, "$1")
    .replace(/<\/?[a-zA-Z][^>]*>/g, " ");
  const plain = stripEmphasis(linked).replace(/\s+/g, " ").trim();
  return plain.replace(/\u0000(\d+)\u0000/g, (_match, index: string) => codes[Number(index)] ?? "");
}

function stripEmphasis(value: string) {
  let text = value;
  for (let pass = 0; pass < 4; pass += 1) {
    const next = text
      .replace(/\*\*\*(.+?)\*\*\*/g, "$1")
      .replace(/___(.+?)___/g, "$1")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/__(.+?)__/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/(?<!\w)_(.+?)_(?!\w)/g, "$1")
      .replace(/~~(.+?)~~/g, "$1");
    if (next === text) break;
    text = next;
  }
  return text.replace(/[*~]+/g, "");
}

function clipLine(text: string) {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= LINE_CLIP) return flat;
  return `${flat.slice(0, LINE_CLIP - 1).trimEnd()}…`;
}
