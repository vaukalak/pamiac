const markerPrefix = "<!-- pamiac-block-colors ";
const markerSuffix = " -->";
const commentPrefix = "<!-- pamiac-block-comments ";
const commentSuffix = " -->";
const maxComments = 40;
const maxCommentLength = 400;

export type NoteCommentMap = Record<string, string>;

export interface NoteBlock {
  id: string;
  type: string;
  props: Record<string, unknown>;
  content?: unknown;
  children?: NoteBlock[];
}

interface NoteSnapshot {
  v: 1;
  hash: string;
  blocks: NoteBlock[];
}

// Markdown has no block text or background color. The editor still saves markdown
// for preview and search, and appends a snapshot so those props survive reload.
export function packNoteContent(markdown: string, blocks: unknown): string {
  const plain = plainBlocks(blocks);
  if (!plain || !containsBlockColor(plain)) return markdown;
  const snapshot: NoteSnapshot = {
    v: 1,
    hash: hashText(markdown),
    blocks: plain,
  };
  return `${markdown}${markerPrefix}${encodeBase64(JSON.stringify(snapshot))}${markerSuffix}`;
}

export function readNoteContent(content: string): { markdown: string; blocks: NoteBlock[] | null } {
  const split = splitNoteContent(content);
  if (!split.encoded) return { markdown: split.markdown, blocks: null };
  const snapshot = decodeSnapshot(split.encoded);
  if (!snapshot || snapshot.hash !== hashText(split.markdown)) {
    return { markdown: split.markdown, blocks: null };
  }
  return { markdown: split.markdown, blocks: snapshot.blocks };
}

export function noteMarkdown(content: string): string {
  return splitNoteContent(content).markdown;
}

export function readNoteComments(content: string): NoteCommentMap {
  return peelNoteComments(content).comments;
}

export function withNoteComments(content: string, comments: NoteCommentMap): string {
  const rest = peelNoteComments(content).rest;
  const clean = cleanComments(comments);
  const ids = Object.keys(clean);
  if (ids.length === 0) return rest;
  const packed = `${rest}${commentPrefix}${encodeBase64(JSON.stringify(clean))}${commentSuffix}`;
  return packed === content ? content : packed;
}

function splitNoteContent(content: string): { markdown: string; encoded: string | null } {
  const body = peelNoteComments(content).rest;
  const start = body.lastIndexOf(markerPrefix);
  if (start < 0) return { markdown: body, encoded: null };
  const end = body.indexOf(markerSuffix, start + markerPrefix.length);
  if (end < 0) return { markdown: body, encoded: null };
  if (body.slice(end + markerSuffix.length).trim().length > 0) {
    return { markdown: body, encoded: null };
  }
  return {
    markdown: body.slice(0, start),
    encoded: body.slice(start + markerPrefix.length, end),
  };
}

function peelNoteComments(content: string): { rest: string; comments: NoteCommentMap } {
  const start = content.lastIndexOf(commentPrefix);
  if (start < 0) return { rest: content, comments: {} };
  const end = content.indexOf(commentSuffix, start + commentPrefix.length);
  if (end < 0) return { rest: content, comments: {} };
  if (content.slice(end + commentSuffix.length).trim().length > 0) {
    return { rest: content, comments: {} };
  }
  return {
    rest: content.slice(0, start),
    comments: decodeComments(content.slice(start + commentPrefix.length, end)),
  };
}

function cleanComments(input: object): NoteCommentMap {
  const next: NoteCommentMap = {};
  const entries = Object.entries(input).sort(([left], [right]) => left.localeCompare(right));
  for (const [key, value] of entries) {
    if (Object.keys(next).length >= maxComments) break;
    if (key.length === 0 || key.length > 80 || key.trim() !== key) continue;
    if (/[\u0000-\u001f<>]/.test(key)) continue;
    if (typeof value !== "string") continue;
    const text = value.trim();
    if (!text || text.length > maxCommentLength) continue;
    next[key] = text;
  }
  return next;
}

function decodeComments(encoded: string): NoteCommentMap {
  try {
    const parsed: unknown = JSON.parse(decodeBase64(encoded));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return cleanComments(parsed);
  } catch {
    return {};
  }
}

function plainBlocks(blocks: unknown): NoteBlock[] | null {
  let plain: unknown;
  try {
    plain = JSON.parse(JSON.stringify(blocks));
  } catch {
    return null;
  }
  if (!Array.isArray(plain) || plain.length === 0 || !plain.every(isNoteBlock)) return null;
  return plain;
}

function isNoteBlock(value: unknown): value is NoteBlock {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const block = value as Record<string, unknown>;
  if (typeof block.id !== "string" || block.id.length === 0) return false;
  if (typeof block.type !== "string" || block.type.length === 0) return false;
  if (!block.props || typeof block.props !== "object" || Array.isArray(block.props)) return false;
  if (!Array.isArray(block.children) || !block.children.every(isNoteBlock)) return false;
  return true;
}

function containsBlockColor(blocks: NoteBlock[]): boolean {
  return blocks.some(blockHasColor);
}

function blockHasColor(block: NoteBlock): boolean {
  if (isSetColor(block.props.textColor) || isSetColor(block.props.backgroundColor)) return true;
  return (block.children ?? []).some(blockHasColor);
}

function isSetColor(value: unknown): boolean {
  return typeof value === "string" && value.length > 0 && value !== "default";
}

function decodeSnapshot(encoded: string): NoteSnapshot | null {
  try {
    const parsed: unknown = JSON.parse(decodeBase64(encoded));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const snapshot = parsed as Record<string, unknown>;
    if (snapshot.v !== 1 || typeof snapshot.hash !== "string") return null;
    if (!Array.isArray(snapshot.blocks) || !snapshot.blocks.every(isNoteBlock)) return null;
    return { v: 1, hash: snapshot.hash, blocks: snapshot.blocks };
  } catch {
    return null;
  }
}

function hashText(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${value.length.toString(16)}:${(hash >>> 0).toString(16)}`;
}

function encodeBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function decodeBase64(value: string): string {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
