"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { BlockIdNode } from "@/lib/block-link";
import { Paragraph } from "@/ui/Paragraph";
import {
  blockLinkArrivalHoldMs,
  blockLinkArrivingClass,
  blockLinkMissingMessage,
  blockLinkScrollDelta,
  blockLinkSettleClass,
  blockLinkTargetClass,
  resolveBlockLink,
  stickyHeaderInset,
  type StickyHeaderBox,
} from "@/lib/note-block-arrival";

interface Properties {
  blocks: readonly BlockIdNode[];
  ready: boolean;
}

function subscribeHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
  };
}

function hashSnapshot() {
  return window.location.hash;
}

function hashServerSnapshot() {
  return "";
}

function blockLinkRow(root: ParentNode, id: string) {
  const block = root.querySelector<HTMLElement>(
    `.bn-editor .bn-block[data-id="${CSS.escape(id)}"]`,
  );
  if (!block) return null;

  const content = block.querySelector<HTMLElement>(":scope > .bn-block-content");
  return content ?? block;
}

function clearBlockLinkHighlight(root: ParentNode) {
  const marked = root.querySelectorAll<HTMLElement>(
    `.${blockLinkTargetClass}, .${blockLinkArrivingClass}, .${blockLinkSettleClass}`,
  );
  for (const node of marked) {
    node.classList.remove(blockLinkTargetClass, blockLinkArrivingClass, blockLinkSettleClass);
  }
}

function scrollPort(element: HTMLElement) {
  let parent = element.parentElement;
  while (parent) {
    const style = getComputedStyle(parent);
    const overflow = `${style.overflowY} ${style.overflow}`;
    if (/(auto|scroll)/.test(overflow) && parent.scrollHeight > parent.clientHeight + 1) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

function headerBox(): StickyHeaderBox | null {
  const header = document.querySelector(".library-mobile-header");
  if (!(header instanceof HTMLElement)) return null;
  const rect = header.getBoundingClientRect();
  return { top: rect.top, bottom: rect.bottom, width: rect.width };
}

function scrollBlockLink(element: HTMLElement, reduced: boolean) {
  const behavior: ScrollBehavior = reduced ? "auto" : "smooth";
  const header = headerBox();
  const viewportWidth = window.innerWidth;
  const block = element.getBoundingClientRect();
  const scroller = scrollPort(element);

  if (scroller) {
    const pane = scroller.getBoundingClientRect();
    const stickyTop = Math.max(0, stickyHeaderInset(header, viewportWidth) - pane.top);
    const delta = blockLinkScrollDelta({
      blockTop: block.top - pane.top,
      blockHeight: block.height,
      viewportHeight: pane.height,
      stickyTop,
      stickyBottom: 0,
    });
    if (delta === null) return;
    scroller.scrollBy({ top: delta, behavior });
    return;
  }

  const viewport = window.visualViewport;
  const offsetTop = viewport?.offsetTop ?? 0;
  const delta = blockLinkScrollDelta({
    blockTop: block.top - offsetTop,
    blockHeight: block.height,
    viewportHeight: viewport?.height ?? window.innerHeight,
    stickyTop: Math.max(0, stickyHeaderInset(header, viewportWidth) - offsetTop),
    stickyBottom: 0,
  });
  if (delta === null) return;
  window.scrollBy({ top: delta, behavior });
}

function releaseUnsolicitedCaret(root: ParentNode) {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return;
  if (!root.contains(active) || !active.closest(".bn-editor")) return;
  active.blur();
}

export function NoteBlockLink(props: Properties) {
  const { blocks, ready } = props;
  const host = useRef<HTMLDivElement>(null);
  const pointerInside = useRef(false);
  const paintMode = useRef<"arrive" | "still">("still");
  const hash = useSyncExternalStore(subscribeHash, hashSnapshot, hashServerSnapshot);
  const [dismissedHash, setDismissedHash] = useState<string | null>(null);
  const resolution = ready ? resolveBlockLink(hash, blocks) : { kind: "absent" as const };

  useEffect(() => {
    setDismissedHash(null);
  }, [hash]);
  const dismissed = dismissedHash === hash;
  const targetId = resolution.kind === "block" && !dismissed ? resolution.id : null;
  const missing = resolution.kind === "missing" && !dismissed;

  useEffect(() => {
    const root = host.current?.closest(".note-editor");
    if (!root) return;

    const onPointerDown = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element) || !target.closest(".bn-editor")) return;
      pointerInside.current = true;
      if (!targetId) return;
      setDismissedHash(window.location.hash);
    };

    root.addEventListener("pointerdown", onPointerDown);
    return () => root.removeEventListener("pointerdown", onPointerDown);
  }, [setDismissedHash, targetId]);

  useEffect(() => {
    const root = host.current?.closest(".note-editor");
    if (!root || !targetId) {
      if (root) clearBlockLinkHighlight(root);
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cancelled = false;
    let frames = 0;
    let timer = 0;
    pointerInside.current = false;
    paintMode.current = reduced ? "still" : "arrive";

    const paint = (row: HTMLElement) => {
      clearBlockLinkHighlight(root);
      row.classList.add(blockLinkTargetClass);
      if (paintMode.current === "arrive") row.classList.add(blockLinkArrivingClass);
    };

    const run = () => {
      if (cancelled) return;
      const row = blockLinkRow(root, targetId);
      if (!row) {
        frames += 1;
        if (frames < 180) window.requestAnimationFrame(run);
        return;
      }

      paint(row);
      window.requestAnimationFrame(() => {
        if (cancelled || pointerInside.current) return;
        scrollBlockLink(row, reduced);
        releaseUnsolicitedCaret(root);
      });

      if (reduced) return;
      timer = window.setTimeout(() => {
        if (cancelled || !row.isConnected) {
          paintMode.current = "still";
          return;
        }
        paintMode.current = "still";
        row.classList.add(blockLinkSettleClass);
        row.getBoundingClientRect();
        row.classList.remove(blockLinkArrivingClass);
      }, blockLinkArrivalHoldMs);
    };

    const onFocusIn = (event: Event) => {
      if (pointerInside.current) return;
      const target = event.target;
      if (!(target instanceof HTMLElement) || !target.closest(".bn-editor")) return;
      target.blur();
    };

    run();
    root.addEventListener("focusin", onFocusIn);
    const stopGuard = window.setTimeout(() => {
      root.removeEventListener("focusin", onFocusIn);
    }, 800);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.clearTimeout(stopGuard);
      root.removeEventListener("focusin", onFocusIn);
      clearBlockLinkHighlight(root);
    };
  }, [targetId]);

  useEffect(() => {
    if (!targetId) return;
    const root = host.current?.closest(".note-editor");
    if (!root) return;

    const repair = () => {
      const row = blockLinkRow(root, targetId);
      if (!row || row.classList.contains(blockLinkTargetClass)) return;
      row.classList.add(blockLinkTargetClass);
      if (paintMode.current === "arrive") row.classList.add(blockLinkArrivingClass);
    };

    const observer = new MutationObserver(repair);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [targetId]);

  useEffect(() => {
    if (!missing) return;
    const notice = host.current?.querySelector(".note-block-link-notice");
    if (!(notice instanceof HTMLElement)) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scrollBlockLink(notice, reduced);
  }, [hash, missing]);

  return (
    <div
      className={missing ? "note-block-link-host" : "note-block-link-host is-empty"}
      ref={host}
      role={missing ? "status" : undefined}
    >
      {missing ? (
        <Paragraph className="note-block-link-notice">{blockLinkMissingMessage}</Paragraph>
      ) : null}
    </div>
  );
}
