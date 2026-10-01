const wikiPattern = /\[\[([^\[\]\n]+?)\]\]/g;

export interface NoteTitleRecord {
  id: string;
  title: string;
  type?: string;
  workspaceId: string | null;
}

interface WikiBlock {
  children?: WikiBlock[];
  content?: unknown;
  type?: string;
}

export function resolveNoteTitle(
  label: string,
  notes: readonly NoteTitleRecord[],
  workspaceId: string | null,
) {
  const wanted = label.trim().toLowerCase();
  if (!wanted) return null;
  const matches = notes.filter((note) => {
    if (note.type && note.type !== "note") return false;
    return note.title.trim().toLowerCase() === wanted;
  });
  if (matches.length === 0) return null;
  const same = matches.find((note) => note.workspaceId === workspaceId);
  return (same ?? matches[0]).id;
}

export function linkifyWikiBlocks<T>(blocks: readonly T[]): T[] {
  return blocks.map((block) => linkifyBlock(block) as T);
}

export function flattenWikiBlock<T>(block: T): T {
  return flattenBlock(block) as T;
}

function linkifyBlock(block: unknown): unknown {
  if (!isRecord(block)) return block;
  const skip = block.type === "codeBlock";
  const next: WikiBlock = {
    ...block,
    content: linkifyContent(block.content, skip),
  };
  if (Array.isArray(block.children)) {
    next.children = block.children.map((child) => linkifyBlock(child) as WikiBlock);
  }
  return next;
}

function flattenBlock(block: unknown): unknown {
  if (!isRecord(block)) return block;
  const next: WikiBlock = {
    ...block,
    content: flattenContent(block.content),
  };
  if (Array.isArray(block.children)) {
    next.children = block.children.map((child) => flattenBlock(child) as WikiBlock);
  }
  return next;
}

function linkifyContent(content: unknown, skip: boolean): unknown {
  if (!Array.isArray(content)) return content;
  const next: unknown[] = [];
  for (const item of content) {
    if (!isRecord(item)) {
      next.push(item);
      continue;
    }
    if (item.type === "noteLink") {
      next.push(item);
      continue;
    }
    if (
      !skip &&
      item.type === "text" &&
      typeof item.text === "string" &&
      !hasCodeStyle(item.styles)
    ) {
      next.push(...splitWikiText(item));
      continue;
    }
    next.push(item);
  }
  return next;
}

function splitWikiText(item: Record<string, unknown>) {
  const text = typeof item.text === "string" ? item.text : "";
  const styles = isRecord(item.styles) ? item.styles : {};
  const parts: Record<string, unknown>[] = [];
  let last = 0;
  wikiPattern.lastIndex = 0;
  for (const match of text.matchAll(wikiPattern)) {
    const index = match.index ?? 0;
    const title = (match[1] ?? "").trim();
    if (!title) continue;
    if (index > last) {
      parts.push({ type: "text", text: text.slice(last, index), styles });
    }
    parts.push({ type: "noteLink", props: { title } });
    last = index + match[0].length;
  }
  if (parts.length === 0) return [item];
  if (last < text.length) parts.push({ type: "text", text: text.slice(last), styles });
  return parts;
}

function flattenContent(content: unknown): unknown {
  if (!Array.isArray(content)) return content;
  return content.map((item) => {
    if (!isRecord(item) || item.type !== "noteLink") return item;
    const props = isRecord(item.props) ? item.props : {};
    const title = typeof props.title === "string" ? props.title.trim() : "";
    return { type: "text", text: title ? `[[${title}]]` : "", styles: {} };
  });
}

function hasCodeStyle(styles: unknown) {
  return isRecord(styles) && styles.code === true;
}

function isRecord(value: unknown): value is Record<string, unknown> & WikiBlock {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
