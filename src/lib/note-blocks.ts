const markerPrefix = "<!-- pamiac-block-colors ";
const markerSuffix = " -->";

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

function splitNoteContent(content: string): { markdown: string; encoded: string | null } {
  const start = content.lastIndexOf(markerPrefix);
  if (start < 0) return { markdown: content, encoded: null };
  const end = content.indexOf(markerSuffix, start + markerPrefix.length);
  if (end < 0) return { markdown: content, encoded: null };
  if (content.slice(end + markerSuffix.length).trim().length > 0) {
    return { markdown: content, encoded: null };
  }
  return {
    markdown: content.slice(0, start),
    encoded: content.slice(start + markerPrefix.length, end),
  };
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
