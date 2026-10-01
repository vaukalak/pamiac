import type { BlockNoteEditor } from "@blocknote/core";
import { NodeSelection, TextSelection } from "prosemirror-state";
import { useEffect, useRef, useState } from "react";
import {
  dragPastThreshold,
  lassoSelection,
  lassoStartAllowed,
  rectFromPoints,
  type LassoSelection,
  type LassoStart,
  type Point,
  type Rect,
} from "@/lib/note-lasso";

interface Properties {
  editor: BlockNoteEditor;
}

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

function blockBoxes(editorRoot: Element) {
  const boxes = [];

  for (const node of editorRoot.querySelectorAll<HTMLElement>(".bn-block[data-id]")) {
    const id = node.dataset.id;
    if (!id) continue;
    const box = node.getBoundingClientRect();
    boxes.push({
      id,
      rect: {
        left: box.left,
        top: box.top,
        right: box.right,
        bottom: box.bottom,
      },
    });
  }

  return boxes;
}

function blockElement(root: Element, id: string) {
  for (const node of root.querySelectorAll<HTMLElement>(".bn-block[data-id]")) {
    if (node.dataset.id === id) return node;
  }
  return null;
}

function blockRange(editor: BlockNoteEditor, element: HTMLElement, id: string) {
  const view = editor.prosemirrorView;
  const pos = view.posAtDOM(element, 0);
  const resolved = view.state.doc.resolve(pos);
  for (let depth = resolved.depth; depth > 0; depth -= 1) {
    const node = resolved.node(depth);
    if (node.attrs.id !== id) continue;
    return {
      before: resolved.before(depth),
      start: resolved.start(depth),
      end: resolved.end(depth),
      atom: node.firstChild?.isAtom === true,
    };
  }
  return null;
}

function selectBlockSpan(editor: BlockNoteEditor, root: Element, firstId: string, lastId: string) {
  const first = blockElement(root, firstId);
  const last = blockElement(root, lastId);
  if (!first || !last) return;
  const start = blockRange(editor, first, firstId);
  const end = blockRange(editor, last, lastId);
  if (!start || !end) return;

  const view = editor.prosemirrorView;
  const selection =
    firstId === lastId && start.atom
      ? NodeSelection.create(view.state.doc, start.before + 1)
      : TextSelection.create(
          view.state.doc,
          Math.min(start.start, end.start),
          Math.max(start.end, end.end),
        );
  view.dispatch(view.state.tr.setSelection(selection));
}

function applyLassoSelection(editor: BlockNoteEditor, root: Element, selection: LassoSelection) {
  if (selection.firstId !== selection.lastId) {
    try {
      editor.setSelection(selection.firstId, selection.lastId);
      editor.focus();
      return;
    } catch {
      // A media block has no inline content, so the range is applied below.
    }
  }

  try {
    selectBlockSpan(editor, root, selection.firstId, selection.lastId);
    editor.focus();
  } catch {
    // Leave the existing selection when the editor cannot represent the range.
  }
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

    function clearDrag() {
      start = null;
      active = false;
      pointerId = null;
      root.classList.remove("note-lasso-dragging");
      setRect(null);
    }

    function onPointerDown(event: PointerEvent) {
      if (start || !lassoStartAllowed(lassoStartFromPointer(event, root))) return;
      start = { x: event.clientX, y: event.clientY };
      active = false;
      pointerId = event.pointerId;
    }

    function onPointerMove(event: PointerEvent) {
      if (!start || event.pointerId !== pointerId) return;
      const current = { x: event.clientX, y: event.clientY };
      if (!active && !dragPastThreshold(start, current)) return;
      if (!active) {
        active = true;
        root.classList.add("note-lasso-dragging");
      }
      event.preventDefault();
      setRect(rectFromPoints(start, current));
    }

    function onPointerUp(event: PointerEvent) {
      if (!start || event.pointerId !== pointerId) return;
      if (active) {
        event.preventDefault();
        lassoEndedAt = performance.now();
        const selection = lassoSelection(
          blockBoxes(root),
          rectFromPoints(start, { x: event.clientX, y: event.clientY }),
        );
        if (selection) applyLassoSelection(editor, root, selection);
      }
      clearDrag();
    }

    function onPointerCancel(event: PointerEvent) {
      if (!start || event.pointerId !== pointerId) return;
      clearDrag();
    }

    function onClick(event: MouseEvent) {
      if (performance.now() - lassoEndedAt > 100) return;
      event.preventDefault();
      event.stopPropagation();
    }

    editorRoot.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);
    editorRoot.addEventListener("click", onClick, true);
    return () => {
      editorRoot.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      editorRoot.removeEventListener("click", onClick, true);
      editorRoot.classList.remove("note-lasso-dragging");
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
