import type { NoteTitleRecord } from "@/lib/note-link";

export const pageSlashMenuTitle = "Page";

export const pageSlashMenuAliases = ["page"];

interface SlashBlock {
  id: string;
  content?: unknown;
}

interface PageInsertEditor {
  getBlock: (id: string) => SlashBlock | undefined;
  updateBlock: (id: string, next: ReturnType<typeof noteLinkParagraph>) => SlashBlock;
  insertBlocks: (
    blocks: ReturnType<typeof noteLinkParagraph>[],
    id: string,
    placement: "after",
  ) => SlashBlock[];
  setTextCursorPosition: (id: string, position: "end") => void;
}

export function pageSlashMenuItem(onItemClick: () => void) {
  return {
    title: pageSlashMenuTitle,
    aliases: [...pageSlashMenuAliases],
    group: "Basic blocks",
    subtext: "Link to another note",
    onItemClick,
  };
}

export function notesForPageMenu(notes: readonly NoteTitleRecord[], workspaceId: string | null) {
  return notes
    .filter((note) => {
      if (note.type && note.type !== "note") return false;
      if (!note.title.trim()) return false;
      return note.workspaceId === workspaceId;
    })
    .toSorted((left, right) => left.title.localeCompare(right.title));
}

export function noteLinkParagraph(title: string) {
  return {
    type: "paragraph" as const,
    content: [{ type: "noteLink" as const, props: { title } }],
  };
}

export function slashMenuFillsCurrentBlock(content: unknown) {
  if (!Array.isArray(content)) return false;
  if (content.length === 0) return true;
  if (content.length !== 1) return false;
  const item = content[0];
  if (!item || typeof item !== "object") return false;
  const text = item as { type?: unknown; text?: unknown };
  return text.type === "text" && text.text === "/";
}

export function insertNotePageLink(editor: PageInsertEditor, blockId: string, title: string) {
  const block = editor.getBlock(blockId);
  const trimmed = title.trim();
  if (!block || !trimmed) return false;

  const next = noteLinkParagraph(trimmed);
  if (slashMenuFillsCurrentBlock(block.content)) {
    const updated = editor.updateBlock(block.id, next);
    editor.setTextCursorPosition(updated.id, "end");
    return true;
  }

  const inserted = editor.insertBlocks([next], block.id, "after")[0];
  if (!inserted) return false;
  editor.setTextCursorPosition(inserted.id, "end");
  return true;
}
