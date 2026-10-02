export const noteCommentGap = 8;
export const noteCommentFallbackHeight = 88;
export const noteCommentBlockClearance = 12;

export interface NoteCommentBlockBox {
  bottom: number;
  left: number;
  width: number;
}

export interface NoteCommentPlacement {
  left: number;
  marginBottom: number;
  top: number;
  width: number;
}

export interface CommentBlockMatch {
  blockIdHit: boolean;
  inBnEditor: boolean;
  isOuter: boolean;
  outerInBnEditor: boolean;
}

export function noteCommentBlockMarginRule(blockId: string, marginBottom: number) {
  if (!blockId || marginBottom <= 0 || !/^[\w-]+$/.test(blockId)) return "";
  return `.note-editor .bn-block-outer[data-id="${blockId}"]{margin-bottom:${marginBottom}px}`;
}

export function placeNoteBlockComment(
  block: NoteCommentBlockBox,
  cardHeight: number,
): NoteCommentPlacement {
  const height = cardHeight > 0 ? cardHeight : noteCommentFallbackHeight;

  return {
    left: block.left,
    marginBottom: height + noteCommentBlockClearance,
    top: block.bottom + noteCommentGap,
    width: block.width,
  };
}

export function commentBlockMatchIndex(matches: readonly CommentBlockMatch[]): number | null {
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    if (!match || !match.blockIdHit || !match.inBnEditor) continue;
    if (match.isOuter || match.outerInBnEditor) return index;
  }

  return null;
}

export function findNoteCommentBlock(root: ParentNode, blockId: string): HTMLElement | null {
  if (!blockId) return null;

  const escaped = CSS.escape(blockId);
  const nodes = [...root.querySelectorAll(`[data-id="${escaped}"], [id="${escaped}"]`)].filter(
    (node): node is HTMLElement => node instanceof HTMLElement,
  );
  const index = commentBlockMatchIndex(nodes.map((node) => commentBlockMatch(node, blockId)));
  const node = index === null ? null : nodes[index];
  if (!node) return null;

  const outer = node.classList.contains("bn-block-outer") ? node : node.closest(".bn-block-outer");
  if (!(outer instanceof HTMLElement)) return null;
  if (!outer.closest(".bn-editor")) return null;
  return outer;
}

export function findNoteCommentBlockInDocument(
  doc: ParentNode,
  blockId: string,
): HTMLElement | null {
  for (const editor of doc.querySelectorAll(".note-editor")) {
    const block = findNoteCommentBlock(editor, blockId);
    if (block) return block;
  }

  return null;
}

function commentBlockMatch(node: HTMLElement, blockId: string): CommentBlockMatch {
  const editor = node.closest(".bn-editor");
  const outer = node.classList.contains("bn-block-outer") ? node : node.closest(".bn-block-outer");

  return {
    blockIdHit: node.getAttribute("data-id") === blockId || node.id === blockId,
    inBnEditor: editor instanceof HTMLElement,
    isOuter: node.classList.contains("bn-block-outer"),
    outerInBnEditor: outer instanceof HTMLElement && Boolean(outer.closest(".bn-editor")),
  };
}
