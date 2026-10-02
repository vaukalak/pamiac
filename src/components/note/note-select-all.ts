import type { BlockNoteEditor } from "@blocknote/core";
import { copyToClipboard, markedMarkdownFromBlocks, readableBlockMarkdown } from "@/lib/block-link";
import { flattenWikiBlock } from "@/lib/note-link";
import { noteExportMarkdown } from "@/lib/note-file";
import {
  editorHasNoteFocus,
  focusedBlockIds,
  isSelectAllShortcut,
  selectAllBlockIds,
  selectAllCopyKind,
  type EditorSelectionSnapshot,
} from "@/lib/note-select-all";

function formField(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

function findBlock<T extends { id: string; children: T[] }>(
  blocks: readonly T[],
  id: string,
): T | undefined {
  for (const block of blocks) {
    if (block.id === id) return block;
    const child = findBlock(block.children, id);
    if (child) return child;
  }
  return undefined;
}

function blockMarkdown(editor: BlockNoteEditor<any, any, any>, ids: readonly string[]) {
  const blocks = ids
    .map((id) => findBlock(editor.document, id))
    .filter((block) => block !== undefined);
  if (blocks.length === 0) return "";
  const marked = markedMarkdownFromBlocks(blocks, (block) =>
    editor.blocksToMarkdownLossy([flattenWikiBlock(block)]),
  );
  return readableBlockMarkdown(marked);
}

function editorSelection(editor: BlockNoteEditor<any, any, any>) {
  const view = editor.prosemirrorView;
  if (!view) return null;
  return view.state.selection as EditorSelectionSnapshot;
}

function cursorBlockId(editor: BlockNoteEditor<any, any, any>) {
  try {
    const id = editor.getTextCursorPosition().block.id;
    return id || null;
  } catch {
    return null;
  }
}

function spannedBlockCount(editor: BlockNoteEditor<any, any, any>) {
  try {
    return editor.getSelection()?.blocks.length ?? 0;
  } catch {
    return 0;
  }
}

export function bindNoteSelectAll(
  editor: BlockNoteEditor<any, any, any>,
  readMarkdown: () => string,
) {
  function onKeyDown(event: KeyboardEvent) {
    if (!isSelectAllShortcut(event)) return;
    if (formField(event.target)) return;

    const view = editor.prosemirrorView;
    const editorDom = editor.domElement ?? null;
    const active = document.activeElement instanceof Element ? document.activeElement : null;
    const blockIds = selectAllBlockIds({
      selectedIds: focusedBlockIds({
        selection: editorSelection(editor),
        active,
        editorDom,
      }),
      cursorBlockId: view ? cursorBlockId(editor) : null,
      spannedBlockCount: view ? spannedBlockCount(editor) : 0,
    });
    const kind = selectAllCopyKind({
      noteFocused: editorHasNoteFocus({
        viewFocused: Boolean(view?.hasFocus()),
        active,
        editorDom,
      }),
      blockFocused: blockIds.length > 0,
    });
    if (!kind) return;

    event.preventDefault();
    event.stopPropagation();
    const markdown =
      kind === "block" ? blockMarkdown(editor, blockIds) : noteExportMarkdown(readMarkdown());
    void copyToClipboard((value) => navigator.clipboard.writeText(value), markdown);
  }

  document.addEventListener("keydown", onKeyDown, true);
  return () => document.removeEventListener("keydown", onKeyDown, true);
}
