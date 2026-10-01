import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  dragPastThreshold,
  lassoSelection,
  lassoStartAllowed,
  rectFromPoints,
  rectsIntersect,
  type BlockBox,
  type LassoStart,
  type Rect,
} from "./note-lasso.ts";

function read(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

function block(id: string, rect: Rect): BlockBox {
  return { id, rect };
}

function allowedStart(patch: Partial<LassoStart> = {}): LassoStart {
  return {
    inEditor: true,
    button: 0,
    inInlineContent: false,
    onLink: false,
    onButton: false,
    onInput: false,
    onTextarea: false,
    onSelect: false,
    onSideMenu: false,
    onDragHandle: false,
    ...patch,
  };
}

describe("note lasso geometry", () => {
  const title = block("title", { left: 40, top: 20, right: 280, bottom: 60 });
  const paragraph = block("paragraph", { left: 40, top: 70, right: 320, bottom: 120 });
  const button = block("button", { left: 40, top: 130, right: 260, bottom: 170 });
  const video = block("video", { left: 40, top: 180, right: 360, bottom: 320 });
  const blocks = [title, paragraph, button, video];

  it("builds a rectangle from either drag direction", () => {
    assert.deepEqual(rectFromPoints({ x: 10, y: 30 }, { x: 80, y: 4 }), {
      left: 10,
      top: 4,
      right: 80,
      bottom: 30,
    });
  });

  it("counts a partial overlap and ignores a shared edge", () => {
    const lasso = { left: 250, top: 40, right: 300, bottom: 90 };
    assert.equal(rectsIntersect(title.rect, lasso), true);
    assert.equal(rectsIntersect(paragraph.rect, lasso), true);
    assert.equal(
      rectsIntersect(button.rect, { left: 260, top: 130, right: 300, bottom: 170 }),
      false,
    );
  });

  it("uses the first and last intersecting blocks in document order", () => {
    const lasso = { left: 48, top: 30, right: 200, bottom: 150 };
    const selection = lassoSelection(blocks, lasso);
    assert.deepEqual(selection, { firstId: "title", lastId: "button" });
  });

  it("does not use a missed block as an endpoint when a later block intersects", () => {
    const lasso = { left: 48, top: 80, right: 200, bottom: 200 };
    assert.deepEqual(lassoSelection(blocks, lasso), { firstId: "paragraph", lastId: "video" });
  });

  it("selects one block when only that block intersects", () => {
    const lasso = { left: 300, top: 190, right: 340, bottom: 220 };
    assert.deepEqual(lassoSelection(blocks, lasso), { firstId: "video", lastId: "video" });
  });

  it("leaves the selection alone when the rectangle misses every block", () => {
    assert.equal(lassoSelection(blocks, { left: 0, top: 0, right: 10, bottom: 10 }), null);
  });

  it("treats a point inside a block as an intersection and a point outside as a miss", () => {
    assert.deepEqual(lassoSelection(blocks, rectFromPoints({ x: 50, y: 40 }, { x: 50, y: 40 })), {
      firstId: "title",
      lastId: "title",
    });
    assert.equal(lassoSelection(blocks, rectFromPoints({ x: 0, y: 0 }, { x: 0, y: 0 })), null);
  });

  it("starts a lasso only after the pointer moves past the threshold", () => {
    const start = { x: 20, y: 20 };
    assert.equal(dragPastThreshold(start, { x: 24, y: 20 }), false);
    assert.equal(dragPastThreshold(start, { x: 20, y: 24 }), false);
    assert.equal(dragPastThreshold(start, { x: 22, y: 22 }), false);
    assert.equal(dragPastThreshold(start, { x: 23, y: 23 }), true);
    assert.equal(dragPastThreshold(start, { x: 25, y: 20 }), true);
    assert.equal(dragPastThreshold(start, { x: 16, y: 16 }), true);
  });

  it("allows a left-button press on editor chrome outside text and controls", () => {
    assert.equal(lassoStartAllowed(allowedStart()), true);
  });

  it("keeps presses inside text, controls, and the side menu as normal gestures", () => {
    const blocked: Partial<LassoStart>[] = [
      { inEditor: false },
      { button: 2 },
      { inInlineContent: true },
      { onLink: true },
      { onButton: true },
      { onInput: true },
      { onTextarea: true },
      { onSelect: true },
      { onSideMenu: true },
      { onDragHandle: true },
    ];
    for (const patch of blocked) {
      assert.equal(lassoStartAllowed(allowedStart(patch)), false);
    }
  });
});

describe("note lasso wiring", () => {
  it("selects intersecting note blocks and does not gate the gesture on editing", () => {
    const gesture = read("../components/note/note-lasso.tsx");
    const move = gesture.slice(gesture.indexOf("function onPointerMove"));
    const beforePrevent = move.slice(0, move.indexOf("event.preventDefault()"));
    assert.match(beforePrevent, /dragPastThreshold/);
    assert.match(gesture, /editor\.setSelection\(selection\.firstId, selection\.lastId\)/);
    assert.equal(gesture.includes("editable"), false);
    assert.match(gesture, /pointer-events|note-lasso/);
    assert.match(gesture, /className="note-lasso"/);
  });

  it("mounts the lasso on the note editor only", () => {
    const editor = read("../components/note-editor.tsx");
    const canvas = read("../components/diagram/uml-canvas.tsx");
    const board = read("../components/library/document-board.tsx");
    assert.match(editor, /<NoteLasso editor=\{editor\} \/>/);
    assert.match(canvas, /const dragOrigin = useRef/);
    assert.equal(canvas.includes("SelectionMode"), false);
    assert.equal(canvas.includes("selectionOnDrag"), false);
    assert.equal(canvas.includes("panOnDrag"), false);
    assert.equal(canvas.includes("dragOrigins"), false);
    assert.equal(board.includes("NoteLasso"), false);
    assert.equal(board.includes("selectionOnDrag"), false);
  });
});
