export const LONG_PRESS_MS = 450;
export const LONG_PRESS_SLOP_PX = 8;

const SKIP_SELECTOR = [
  "a",
  "button",
  "input",
  "textarea",
  "select",
  ".bn-side-menu",
  ".bn-formatting-toolbar",
  ".bn-mobile-formatting-toolbar",
  ".bn-suggestion-menu",
  ".bn-drag-handle-menu",
  ".note-slash-backdrop",
  ".note-block-menu-backdrop",
].join(", ");

export function blockIdFromTarget(target: EventTarget | null) {
  const element = eventElement(target);
  if (!element) return null;
  if (element.closest(SKIP_SELECTOR)) return null;
  return element.closest(".bn-block[data-id]")?.getAttribute("data-id") ?? null;
}

export function pointerMovedPastSlop(
  startX: number,
  startY: number,
  x: number,
  y: number,
  slop = LONG_PRESS_SLOP_PX,
) {
  return Math.hypot(x - startX, y - startY) > slop;
}

export function dropPlacement(clientY: number, rect: { top: number; bottom: number }) {
  const midpoint = rect.top + (rect.bottom - rect.top) / 2;
  if (clientY < midpoint) return "before" as const;
  return "after" as const;
}

export function blockIds(
  blocks: readonly {
    id: string;
    children?: readonly { id: string; children?: readonly unknown[] }[];
  }[],
): string {
  return blocks
    .map((block) => `${block.id}:${blockIds((block.children ?? []) as typeof blocks)}`)
    .join(",");
}

export function canDropBlock(
  source: { id: string; children?: readonly { id: string; children?: readonly unknown[] }[] },
  targetId: string,
) {
  if (source.id === targetId) return false;
  return !blockContains(source, targetId);
}

function blockContains(
  block: { id: string; children?: readonly { id: string; children?: readonly unknown[] }[] },
  targetId: string,
): boolean {
  for (const child of block.children ?? []) {
    if (child.id === targetId) return true;
    if (blockContains(child as typeof block, targetId)) return true;
  }
  return false;
}

function eventElement(target: EventTarget | null) {
  if (target instanceof Element) return target;
  if (target instanceof Text) return target.parentElement;
  return null;
}
