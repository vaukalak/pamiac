export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface BlockBox {
  id: string;
  rect: Rect;
}

export interface LassoSelection {
  firstId: string;
  lastId: string;
}

export interface LassoStart {
  inEditor: boolean;
  button: number;
  inInlineContent: boolean;
  onLink: boolean;
  onButton: boolean;
  onInput: boolean;
  onTextarea: boolean;
  onSelect: boolean;
  onSideMenu: boolean;
  onDragHandle: boolean;
}

export const LASSO_DRAG_THRESHOLD = 4;

export function rectFromPoints(start: Point, end: Point): Rect {
  return {
    left: Math.min(start.x, end.x),
    top: Math.min(start.y, end.y),
    right: Math.max(start.x, end.x),
    bottom: Math.max(start.y, end.y),
  };
}

export function rectsIntersect(first: Rect, second: Rect): boolean {
  return (
    first.left < second.right &&
    first.right > second.left &&
    first.top < second.bottom &&
    first.bottom > second.top
  );
}

export function lassoSelection(blocks: readonly BlockBox[], lasso: Rect): LassoSelection | null {
  let firstId: string | null = null;
  let lastId: string | null = null;

  for (const block of blocks) {
    if (!rectsIntersect(block.rect, lasso)) continue;
    if (firstId === null) firstId = block.id;
    lastId = block.id;
  }

  if (firstId === null || lastId === null) return null;
  return { firstId, lastId };
}

export function dragPastThreshold(
  start: Point,
  current: Point,
  threshold = LASSO_DRAG_THRESHOLD,
): boolean {
  const dx = current.x - start.x;
  const dy = current.y - start.y;
  return dx * dx + dy * dy > threshold * threshold;
}

export function lassoStartAllowed(start: LassoStart): boolean {
  if (!start.inEditor || start.button !== 0) return false;
  if (start.inInlineContent) return false;
  if (start.onLink || start.onButton || start.onInput || start.onTextarea || start.onSelect) {
    return false;
  }
  if (start.onSideMenu || start.onDragHandle) return false;
  return true;
}
