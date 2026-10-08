import { blockIdFromHash, type BlockIdNode } from "./block-link.ts";

export const blockLinkMissingMessage = "The linked block is no longer available.";
export const blockLinkArrivalHoldMs = 2500;
export const blockLinkArrivalFadeMs = 400;
export const blockLinkSubtleBackground = "rgba(180, 230, 40, 0.1)";
export const blockLinkStrongBackground = "rgba(180, 230, 40, 0.28)";
export const blockLinkTargetClass = "note-block-link-target";
export const blockLinkArrivingClass = "note-block-link-arriving";
export const blockLinkSettleClass = "note-block-link-settle";

export type BlockLinkResolution =
  { kind: "absent" } | { kind: "missing" } | { kind: "block"; id: string };

export interface BlockLinkScrollInput {
  blockTop: number;
  blockHeight: number;
  viewportHeight: number;
  stickyTop: number;
  stickyBottom: number;
}

export interface StickyHeaderBox {
  top: number;
  bottom: number;
  width: number;
}

export function resolveBlockLink(
  hash: string,
  blocks: readonly BlockIdNode[],
): BlockLinkResolution {
  if (!hash.startsWith("#") || hash.length < 2) return { kind: "absent" };

  const id = blockIdFromHash(hash, blocks);
  if (id) return { kind: "block", id };
  return { kind: "missing" };
}

export function stickyHeaderInset(header: StickyHeaderBox | null, viewportWidth: number) {
  if (!header || viewportWidth <= 0) return 0;
  if (header.top > 1) return 0;
  if (header.bottom <= 0) return 0;
  if (header.width < viewportWidth * 0.6) return 0;
  return header.bottom;
}

export function blockLinkScrollDelta(input: BlockLinkScrollInput) {
  const visibleTop = input.stickyTop;
  const visibleBottom = input.viewportHeight - input.stickyBottom;
  const span = visibleBottom - visibleTop;
  if (span <= 0) return null;

  const desiredTop = visibleTop + span / 3;
  const delta = input.blockTop - desiredTop;
  const blockBottom = input.blockTop + input.blockHeight;
  const fullyInside = input.blockTop >= visibleTop + 8 && blockBottom <= visibleBottom - 8;
  const topRatio = (input.blockTop - visibleTop) / span;
  if (fullyInside && topRatio >= 0.12 && topRatio <= 0.55) return null;
  if (Math.abs(delta) < 4) return null;
  return delta;
}
