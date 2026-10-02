export interface SelectAllKey {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}

interface SelectionNode {
  attrs?: { id?: unknown };
}

export interface EditorSelectionSnapshot {
  node?: SelectionNode;
  nodes?: readonly SelectionNode[];
}

export function isSelectAllShortcut(key: SelectAllKey) {
  if (key.altKey || key.shiftKey) return false;
  if (key.key.toLowerCase() !== "a") return false;
  return key.metaKey || key.ctrlKey;
}

export function selectAllCopyKind(input: { noteFocused: boolean; blockFocused: boolean }) {
  if (input.blockFocused) return "block" as const;
  if (input.noteFocused) return "note" as const;
  return null;
}

export function blockIdsFromEditorSelection(selection: EditorSelectionSnapshot | null | undefined) {
  if (!selection) return [];
  if (selection.nodes && selection.nodes.length > 0) return uniqueIds(selection.nodes);
  if (selection.node) return uniqueIds([selection.node]);
  return [];
}

export function nestedBlockId(active: Element | null, editorDom: Element | null) {
  if (!active || !editorDom || active === editorDom) return null;
  if (active.classList.contains("bn-editor")) return null;
  if (!editorDom.contains(active)) return null;
  const block = active.closest(".bn-block[data-id]");
  if (!block) return null;
  return block.getAttribute("data-id");
}

export function selectedNodeBlockId(editorDom: Element | null) {
  if (!editorDom) return null;
  const selected = editorDom.querySelector(".ProseMirror-selectednode");
  if (!selected) return null;
  const block = selected.closest(".bn-block[data-id]");
  return block?.getAttribute("data-id") ?? null;
}

export function editorHasNoteFocus(input: {
  viewFocused: boolean;
  active: Element | null;
  editorDom: Element | null;
}) {
  if (input.viewFocused) return true;
  if (!input.active || !input.editorDom) return false;
  return input.active === input.editorDom || input.editorDom.contains(input.active);
}

export function focusedBlockIds(input: {
  selection: EditorSelectionSnapshot | null | undefined;
  active: Element | null;
  editorDom: Element | null;
}) {
  const selected = blockIdsFromEditorSelection(input.selection);
  if (selected.length > 0) return selected;
  const fromDom = selectedNodeBlockId(input.editorDom);
  if (fromDom) return [fromDom];
  const nested = nestedBlockId(input.active, input.editorDom);
  if (nested) return [nested];
  return [];
}

export function selectAllBlockIds(input: {
  selectedIds: readonly string[];
  cursorBlockId: string | null;
  spannedBlockCount: number;
}) {
  if (input.spannedBlockCount > 1) return [];
  if (input.selectedIds.length > 0) return [...input.selectedIds];
  if (input.cursorBlockId) return [input.cursorBlockId];
  return [];
}

function uniqueIds(nodes: readonly SelectionNode[]) {
  const ids: string[] = [];
  for (const node of nodes) {
    const id = node.attrs?.id;
    if (typeof id === "string" && id && !ids.includes(id)) ids.push(id);
  }
  return ids;
}
