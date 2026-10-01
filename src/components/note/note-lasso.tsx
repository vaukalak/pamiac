import type { BlockNoteEditor } from "@blocknote/core";
import { Selection } from "prosemirror-state";
import { useEffect, useRef, useState } from "react";
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
  editor: BlockNoteEditor;
}

const HIGHLIGHT_CLASS = "note-lasso-block";

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

function paintHighlight(root: Element, ids: readonly string[]) {
  const wanted = new Set(ids);
  for (const node of root.querySelectorAll<HTMLElement>(".bn-block[data-id]")) {
    const id = node.dataset.id;
    node.classList.toggle(HIGHLIGHT_CLASS, Boolean(id && wanted.has(id)));
  }
}

function collapseEditorSelection(editor: BlockNoteEditor) {
  collapseLeftoverSelection(editor.prosemirrorView, (position) => Selection.near(position));
}

function clearDomSelection() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  selection.removeAllRanges();
}

export function NoteLasso(props: Properties) {
  const { editor } = props;
  const anchorRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<Rect | null>(null);

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
    let frame = 0;
    let pendingPoint: Point | null = null;

    function scheduleRepaint() {
      queueMicrotask(() => paintHighlight(root, highlightedIds));
      requestAnimationFrame(() => paintHighlight(root, highlightedIds));
    }

    function show(ids: readonly string[]) {
      highlightedIds = ids;
      paintHighlight(root, highlightedIds);
      scheduleRepaint();
    }

    function cancelLassoFrame() {
      if (frame === 0) return;
      cancelAnimationFrame(frame);
      frame = 0;
    }

    function clearHighlight() {
      committedIds = [];
      highlightedIds = [];
      paintHighlight(root, []);
    }

    function clearDrag() {
      cancelLassoFrame();
      pendingPoint = null;
      start = null;
      active = false;
      pointerId = null;
      root.classList.remove("note-lasso-dragging");
      setRect(null);
    }

    function onPointerDown(event: PointerEvent) {
      downInEditor = root.contains(event.target as Node);
      if (start || !lassoStartAllowed(lassoStartFromPointer(event, root))) return;
      event.preventDefault();
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
      }
      event.preventDefault();
      clearDomSelection();
      pendingPoint = current;
      if (frame !== 0) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!start || !pendingPoint) return;
        const next = rectFromPoints(start, pendingPoint);
        setRect(next);
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
          clearDomSelection();
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
      paintHighlight(root, committedIds);
      clearDrag();
    }

    function onClick(event: MouseEvent) {
      if (performance.now() - lassoEndedAt > 100) return;
      event.preventDefault();
      event.stopPropagation();
    }

    function onSelectStart(event: Event) {
      if (!active) return;
      event.preventDefault();
    }

    function onEditorTransaction() {
      scheduleRepaint();
    }

    const observer = new MutationObserver(() => {
      paintHighlight(root, highlightedIds);
    });
    observer.observe(root, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["class"],
    });
    const stopSelectionChange = editor.onSelectionChange(onEditorTransaction);
    const stopChange = editor.onChange(onEditorTransaction);

    editorRoot.addEventListener("pointerdown", onPointerDown);
    editorRoot.addEventListener("selectstart", onSelectStart);
    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);
    editorRoot.addEventListener("click", onClick, true);
    return () => {
      cancelLassoFrame();
      stopSelectionChange();
      stopChange();
      observer.disconnect();
      editorRoot.removeEventListener("pointerdown", onPointerDown);
      editorRoot.removeEventListener("selectstart", onSelectStart);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      editorRoot.removeEventListener("click", onClick, true);
      editorRoot.classList.remove("note-lasso-dragging");
      highlightedIds = [];
      paintHighlight(root, []);
    };
  }, [editor]);

  return (
    <div ref={anchorRef} className="note-lasso-host">
      {rect ? (
        <div
          className="note-lasso"
          style={{
            left: rect.left,
            top: rect.top,
            width: rect.right - rect.left,
            height: rect.bottom - rect.top,
          }}
        />
      ) : null}
    </div>
  );
}
