export interface BlockMarkdownNode {
  id: string;
  markdown: string;
  children: BlockMarkdownNode[];
}

export interface BlockIdNode {
  id: string;
  children?: readonly BlockIdNode[];
}

interface NestedBlock {
  id: string;
  children: readonly NestedBlock[];
}

interface Marker {
  closing: boolean;
  depth: number;
  id: string;
  start: number;
  end: number;
}

const MARKER = /<!--(\/)?pamiac-block depth="(\d+)" id="([^"]*)"-->/g;
const OPEN_MARKER = "<!--pamiac-block ";
const CLOSE_MARKER = "<!--/pamiac-block ";
const ESCAPED_OPEN_MARKER = "<!--\u200bpamiac-block ";
const ESCAPED_CLOSE_MARKER = "<!--/\u200bpamiac-block ";

export function blockPermalink(href: string, blockId: string) {
  const hashAt = href.indexOf("#");
  const base = hashAt === -1 ? href : href.slice(0, hashAt);
  return `${base}#${blockId}`;
}

export async function copyToClipboard(writeText: (value: string) => Promise<void>, value: string) {
  try {
    await writeText(value);
  } catch {
    return;
  }
}

export function blockIdFromHash(hash: string, blocks: readonly BlockIdNode[]) {
  if (!hash.startsWith("#") || hash.length < 2) return null;

  let id = hash.slice(1);
  try {
    id = decodeURIComponent(id);
  } catch {
    return null;
  }

  if (!blockTreeHasId(blocks, id)) return null;
  return id;
}

export function blockTreeHasId(blocks: readonly BlockIdNode[], id: string): boolean {
  return blocks.some((block) => block.id === id || blockTreeHasId(block.children ?? [], id));
}

export function serializeBlockMarkdown(nodes: readonly BlockMarkdownNode[]) {
  return nodes.map((node) => serializeNode(node, 0)).join("");
}

export function parseBlockMarkdown(input: string): BlockMarkdownNode[] | null {
  if (!input.includes(OPEN_MARKER)) return null;

  const markers = markersIn(input);
  if (markers === null || markers.length === 0) return null;

  const cursor = { index: 0 };
  const nodes = parseLevel(input, markers, cursor, 0);
  if (nodes === null || cursor.index !== markers.length) return null;
  return nodes;
}

export function readableBlockMarkdown(markdown: string) {
  const nodes = parseBlockMarkdown(markdown);
  if (!nodes) return markdown;
  return nodes.map((node) => flattenNode(node)).join("");
}

export function markedMarkdownFromBlocks<T extends NestedBlock>(
  blocks: readonly T[],
  blockMarkdown: (block: T) => string,
) {
  return serializeBlockMarkdown(blocks.map((block) => nodeFromBlock(block, blockMarkdown)));
}

export function blocksFromMarkedMarkdown<T extends NestedBlock>(
  nodes: readonly BlockMarkdownNode[],
  parseMarkdown: (markdown: string) => readonly T[],
): T[] {
  return nodes.flatMap((node) => {
    const parsed = parseMarkdown(node.markdown);
    const [first, ...rest] = parsed;
    if (!first) return rest;

    const rebuilt = {
      ...first,
      id: node.id,
      children: blocksFromMarkedMarkdown(node.children, parseMarkdown),
    } as T;
    return [rebuilt, ...rest];
  });
}

function nodeFromBlock<T extends NestedBlock>(
  block: T,
  blockMarkdown: (block: T) => string,
): BlockMarkdownNode {
  const bare = { ...block, children: [] } as T;
  return {
    id: block.id,
    markdown: blockMarkdown(bare),
    children: block.children.map((child) => nodeFromBlock(child as T, blockMarkdown)),
  };
}

function serializeNode(node: BlockMarkdownNode, depth: number): string {
  const id = encodeURIComponent(node.id);
  const open = `<!--pamiac-block depth="${String(depth)}" id="${id}"-->\n`;
  const close = `<!--/pamiac-block depth="${String(depth)}" id="${id}"-->\n`;
  const children = node.children.map((child) => serializeNode(child, depth + 1)).join("");
  return `${open}${escapeBlockMarkdown(node.markdown)}${children}${close}`;
}

function flattenNode(node: BlockMarkdownNode): string {
  return node.markdown + node.children.map((child) => flattenNode(child)).join("");
}

function escapeBlockMarkdown(markdown: string) {
  return markdown
    .replaceAll(CLOSE_MARKER, ESCAPED_CLOSE_MARKER)
    .replaceAll(OPEN_MARKER, ESCAPED_OPEN_MARKER);
}

function unescapeBlockMarkdown(markdown: string) {
  return markdown
    .replaceAll(ESCAPED_OPEN_MARKER, OPEN_MARKER)
    .replaceAll(ESCAPED_CLOSE_MARKER, CLOSE_MARKER);
}

function markersIn(input: string): Marker[] | null {
  const markers: Marker[] = [];
  MARKER.lastIndex = 0;

  for (const match of input.matchAll(MARKER)) {
    const id = decodeId(match[3] ?? "");
    const start = match.index;
    if (id === null || start === undefined) return null;
    markers.push({
      closing: match[1] === "/",
      depth: Number(match[2]),
      id,
      start,
      end: start + match[0].length,
    });
  }

  return markers;
}

function decodeId(value: string) {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function parseLevel(
  input: string,
  markers: readonly Marker[],
  cursor: { index: number },
  depth: number,
): BlockMarkdownNode[] | null {
  const nodes: BlockMarkdownNode[] = [];
  let gapFrom = depth === 0 ? 0 : null;

  while (cursor.index < markers.length) {
    const marker = markers[cursor.index];
    if (!marker) return null;

    if (marker.closing) {
      if (marker.depth !== depth - 1) return null;
      if (gapFrom !== null && input.slice(gapFrom, marker.start).trim() !== "") return null;
      return nodes;
    }

    if (marker.depth !== depth) return null;
    if (gapFrom !== null && input.slice(gapFrom, marker.start).trim() !== "") return null;

    const open = marker;
    cursor.index += 1;
    const next = markers[cursor.index];
    if (!next) return null;

    const raw = input.slice(open.end, next.start);
    if (!raw.startsWith("\n")) return null;
    const markdown = unescapeBlockMarkdown(raw.slice(1));
    let children: BlockMarkdownNode[] = [];

    if (!next.closing) {
      const nested = parseLevel(input, markers, cursor, depth + 1);
      if (nested === null) return null;
      children = nested;
    }

    const close = markers[cursor.index];
    if (!close || !close.closing || close.depth !== depth || close.id !== open.id) return null;
    cursor.index += 1;
    nodes.push({ id: open.id, markdown, children });
    gapFrom = close.end;
  }

  if (depth !== 0) return null;
  if (gapFrom !== null && input.slice(gapFrom).trim() !== "") return null;
  return nodes;
}
