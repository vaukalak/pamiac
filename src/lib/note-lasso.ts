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
  contentRect?: Rect | null;
  parentId?: string | null;
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

function childrenByParent(blocks: readonly BlockBox[]) {
  const children = new Map<string, string[]>();
  for (const block of blocks) {
    if (!block.parentId) continue;
    const list = children.get(block.parentId);
    if (list) list.push(block.id);
    else children.set(block.parentId, [block.id]);
  }
  return children;
}

function descendantIntersects(
  id: string,
  intersectingIds: ReadonlySet<string>,
  children: ReadonlyMap<string, readonly string[]>,
) {
  const pending = [...(children.get(id) ?? [])];
  const seen = new Set<string>();
  while (pending.length > 0) {
    const next = pending.pop();
    if (!next || seen.has(next)) continue;
    seen.add(next);
    if (intersectingIds.has(next)) return true;
    const nested = children.get(next);
    if (nested) pending.push(...nested);
  }
  return false;
}

export function lassoSelection(blocks: readonly BlockBox[], lasso: Rect): string[] | null {
  const intersecting = blocks.filter((block) => rectsIntersect(block.rect, lasso));
  if (intersecting.length === 0) return null;

  const intersectingIds = new Set(intersecting.map((block) => block.id));
  const children = childrenByParent(blocks);
  const ids = intersecting
    .filter((block) => {
      if (!descendantIntersects(block.id, intersectingIds, children)) return true;
      return block.contentRect != null && rectsIntersect(block.contentRect, lasso);
    })
    .map((block) => block.id);

  return ids.length > 0 ? ids : null;
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

export function collapseLeftoverSelection<Position, Mark, Transaction>(
  view:
    | {
        state: {
          selection: { empty: boolean; from: number };
          doc: { resolve: (position: number) => Position };
          tr: { setSelection: (selection: Mark) => Transaction };
        };
        dispatch: (transaction: Transaction) => void;
      }
    | null
    | undefined,
  near: (position: Position) => Mark,
) {
  if (!view || view.state.selection.empty) return;
  const collapsed = near(view.state.doc.resolve(view.state.selection.from));
  view.dispatch(view.state.tr.setSelection(collapsed));
}
