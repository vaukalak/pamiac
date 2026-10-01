import type { BlockNoteEditor } from "@blocknote/core";
import { Selection } from "prosemirror-state";
import { useEffect, useRef } from "react";
import {
  collapseLeftoverSelection,
  dragPastThreshold,
  lassoSelection,
  lassoStartAllowed,
  rectFromPoints,
  type BlockBox,
  type LassoStart,
  type Point,
  type Rect,
} from "@/lib/note-lasso";

interface Properties {
  editor: BlockNoteEditor<any, any, any>;
}

const HIGHLIGHT_CLASS = "note-lasso-highlight";
const MARQUEE_CLASS = "note-lasso-visible";

let collapsingSelection = false;

function eventElement(target: EventTarget | null) {
  if (target instanceof Element) return target;
  if (target instanceof Text) return target.parentElement;
  return null;
}

function lassoStartFromPointer(event: PointerEvent, editorRoot: Element): LassoStart {
  const element = eventElement(event.target);
  const matches = (selector: string) => Boolean(element?.closest(selector));

  return {
    inEditor: editorRoot.contains(event.target as Node),
    button: event.button,
    inInlineContent: matches(".bn-inline-content"),
    onLink: matches("a"),
    onButton: matches("button"),
    onInput: matches("input"),
    onTextarea: matches("textarea"),
    onSelect: matches("select"),
    onSideMenu: matches(".bn-side-menu"),
    onDragHandle:
      matches(".bn-drag-handle-menu") || Boolean(element?.closest("[data-test='dragHandle']")),
  };
}

function elementRect(element: HTMLElement): Rect {
  const box = element.getBoundingClientRect();
  return {
    left: box.left,
    top: box.top,
    right: box.right,
    bottom: box.bottom,
  };
}

function blockBoxes(editorRoot: Element): BlockBox[] {
  const boxes: BlockBox[] = [];
  for (const node of editorRoot.querySelectorAll<HTMLElement>(".bn-block[data-id]")) {
    const id = node.dataset.id;
    if (!id) continue;
    const parent = node.parentElement?.closest(".bn-block[data-id]");
    let contentRect: Rect | null = null;
    for (const child of node.children) {
      if (!(child instanceof HTMLElement) || !child.classList.contains("bn-block-content")) {
        continue;
      }
      contentRect = elementRect(child);
      break;
    }
    boxes.push({
      id,
      rect: elementRect(node),
      contentRect,
      parentId: parent instanceof HTMLElement ? (parent.dataset.id ?? null) : null,
    });
  }
  return boxes;
}

function placeHighlight(node: HTMLElement, rect: Rect) {
  node.style.left = `${rect.left}px`;
  node.style.top = `${rect.top}px`;
  node.style.width = `${Math.max(0, rect.right - rect.left)}px`;
  node.style.height = `${Math.max(0, rect.bottom - rect.top)}px`;
}

function paintHighlight(root: Element, layer: HTMLElement | null, ids: readonly string[]) {
  if (!layer) return;
  const wanted = new Set(ids);
  const boxes = new Map(
    blockBoxes(root)
      .filter((box) => wanted.has(box.id))
      .map((box) => [box.id, box.contentRect ?? box.rect]),
  );
  for (const child of [...layer.children]) {
    if (!(child instanceof HTMLElement)) continue;
    const id = child.dataset.id;
    const rect = id ? boxes.get(id) : undefined;
    if (!id || !rect) {
      child.remove();
      continue;
    }
    placeHighlight(child, rect);
    boxes.delete(id);
  }
  for (const [id, rect] of boxes) {
    const node = document.createElement("div");
    node.className = HIGHLIGHT_CLASS;
    node.dataset.id = id;
    placeHighlight(node, rect);
    layer.append(node);
  }
}

function paintLasso(node: HTMLDivElement | null, rect: Rect | null) {
  if (!node) return;
  if (!rect) {
    node.classList.remove(MARQUEE_CLASS);
    node.style.display = "none";
    return;
  }
  if (!node.classList.contains(MARQUEE_CLASS)) {
    node.classList.add(MARQUEE_CLASS);
    node.style.display = "block";
  }
  node.style.left = `${rect.left}px`;
  node.style.top = `${rect.top}px`;
  node.style.width = `${rect.right - rect.left}px`;
  node.style.height = `${rect.bottom - rect.top}px`;
}

function collapseEditorSelection(editor: BlockNoteEditor<any, any, any>) {
  if (collapsingSelection) return;
  collapsingSelection = true;
  try {
    collapseLeftoverSelection(editor.prosemirrorView, (position) => Selection.near(position));
  } finally {
    collapsingSelection = false;
  }
}

function clearDomSelection() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  selection.removeAllRanges();
}

export function NoteLasso(props: Properties) {
  const { editor } = props;
  const anchorRef = useRef<HTMLDivElement>(null);
  const lassoRef = useRef<HTMLDivElement>(null);
  const highlightsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const editorRoot = anchorRef.current?.parentElement;
    if (!editorRoot) return;
    const root = editorRoot;

    let start: Point | null = null;
    let active = false;
    let pointerId: number | null = null;
    let lassoEndedAt = 0;
    let committedIds: string[] = [];
    let highlightedIds: readonly string[] = [];
    let downInEditor = false;
    let armed = false;
    let frame = 0;
    let scrollFrame = 0;
    let pendingPoint: Point | null = null;
    let paintingFromChange = false;

    function show(ids: readonly string[]) {
      highlightedIds = ids;
      paintHighlight(root, highlightsRef.current, highlightedIds);
    }

    function cancelLassoFrame() {
      if (frame === 0) return;
      cancelAnimationFrame(frame);
      frame = 0;
    }

    function clearHighlight() {
      committedIds = [];
      highlightedIds = [];
      paintHighlight(root, highlightsRef.current, []);
    }

    function clearDrag() {
      cancelLassoFrame();
      pendingPoint = null;
      start = null;
      active = false;
      armed = false;
      pointerId = null;
      root.classList.remove("note-lasso-dragging");
      paintLasso(lassoRef.current, null);
    }

    function onPointerDown(event: PointerEvent) {
      downInEditor = root.contains(event.target as Node);
      if (start || !lassoStartAllowed(lassoStartFromPointer(event, root))) return;
      event.preventDefault();
      event.stopPropagation();
      armed = true;
      start = { x: event.clientX, y: event.clientY };
      active = false;
      pointerId = event.pointerId;
      root.classList.add("note-lasso-dragging");
    }

    function onPointerMove(event: PointerEvent) {
      if (!start || event.pointerId !== pointerId) return;
      const current = { x: event.clientX, y: event.clientY };
      if (!active && !dragPastThreshold(start, current)) return;
      if (!active) {
        active = true;
        root.classList.add("note-lasso-dragging");
        collapseEditorSelection(editor);
        clearDomSelection();
      }
      event.preventDefault();
      pendingPoint = current;
      if (frame !== 0) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!start || !pendingPoint) return;
        const next = rectFromPoints(start, pendingPoint);
        paintLasso(lassoRef.current, next);
        show(lassoSelection(blockBoxes(root), next) ?? []);
      });
    }

    function onPointerUp(event: PointerEvent) {
      const editorPress = downInEditor;
      downInEditor = false;
      if (start && event.pointerId === pointerId) {
        if (active) {
          event.preventDefault();
          cancelLassoFrame();
          pendingPoint = null;
          lassoEndedAt = performance.now();
          const next = rectFromPoints(start, { x: event.clientX, y: event.clientY });
          const selection = lassoSelection(blockBoxes(root), next);
          if (selection) committedIds = selection;
          show(selection ?? committedIds);
        } else if (editorPress) {
          clearHighlight();
        }
        clearDrag();
        return;
      }
      if (editorPress) {
        clearHighlight();
      }
    }

    function onPointerCancel(event: PointerEvent) {
      if (!start || event.pointerId !== pointerId) return;
      cancelLassoFrame();
      pendingPoint = null;
      highlightedIds = committedIds;
      paintHighlight(root, highlightsRef.current, committedIds);
      clearDrag();
    }

    function onClick(event: MouseEvent) {
      if (performance.now() - lassoEndedAt > 100) return;
      event.preventDefault();
      event.stopPropagation();
    }

    function onSelectStart(event: Event) {
      if (!armed) return;
      event.preventDefault();
    }

    function onScroll() {
      if (scrollFrame !== 0) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        paintHighlight(root, highlightsRef.current, highlightedIds);
      });
    }

    function onDocumentChange() {
      if (paintingFromChange) return;
      paintingFromChange = true;
      try {
        paintHighlight(root, highlightsRef.current, highlightedIds);
      } finally {
        paintingFromChange = false;
      }
    }

    const stopChange = editor.onChange(onDocumentChange);

    editorRoot.addEventListener("pointerdown", onPointerDown, true);
    editorRoot.addEventListener("selectstart", onSelectStart);
    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    editorRoot.addEventListener("click", onClick, true);
    return () => {
      cancelLassoFrame();
      if (scrollFrame !== 0) cancelAnimationFrame(scrollFrame);
      stopChange();
      editorRoot.removeEventListener("pointerdown", onPointerDown, true);
      editorRoot.removeEventListener("selectstart", onSelectStart);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      editorRoot.removeEventListener("click", onClick, true);
      editorRoot.classList.remove("note-lasso-dragging");
      highlightedIds = [];
      paintHighlight(root, highlightsRef.current, []);
      paintLasso(lassoRef.current, null);
    };
  }, [editor]);

  return (
    <div ref={anchorRef} className="note-lasso-host">
      <div ref={highlightsRef} className="note-lasso-highlights" />
      <div ref={lassoRef} className="note-lasso" />
    </div>
  );
}
