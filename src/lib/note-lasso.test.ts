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

function block(
  id: string,
  rect: Rect,
  extra: Pick<BlockBox, "contentRect" | "parentId"> = {},
): BlockBox {
  return { id, rect, ...extra };
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

  it("lists every intersecting block in document order", () => {
    const lasso = { left: 48, top: 30, right: 200, bottom: 150 };
    assert.deepEqual(lassoSelection(blocks, lasso), ["title", "paragraph", "button"]);
  });

  it("skips a block the rectangle misses even when later blocks intersect", () => {
    const sparse = [
      block("a", { left: 0, top: 0, right: 100, bottom: 20 }),
      block("b", { left: 0, top: 40, right: 20, bottom: 60 }),
      block("c", { left: 0, top: 80, right: 100, bottom: 100 }),
    ];
    assert.deepEqual(lassoSelection(sparse, { left: 40, top: 0, right: 90, bottom: 100 }), [
      "a",
      "c",
    ]);
  });

  it("highlights one block when only that block intersects", () => {
    const lasso = { left: 300, top: 190, right: 340, bottom: 220 };
    assert.deepEqual(lassoSelection(blocks, lasso), ["video"]);
  });

  it("leaves the selection alone when the rectangle misses every block", () => {
    assert.equal(lassoSelection(blocks, { left: 0, top: 0, right: 10, bottom: 10 }), null);
  });

  it("treats a point inside a block as an intersection and a point outside as a miss", () => {
    assert.deepEqual(lassoSelection(blocks, rectFromPoints({ x: 50, y: 40 }, { x: 50, y: 40 })), [
      "title",
    ]);
    assert.equal(lassoSelection(blocks, rectFromPoints({ x: 0, y: 0 }, { x: 0, y: 0 })), null);
  });

  it("highlights an intersecting descendant instead of the ancestor that only contains it", () => {
    const nested = [
      block(
        "parent",
        { left: 0, top: 0, right: 200, bottom: 200 },
        { contentRect: { left: 0, top: 0, right: 200, bottom: 24 }, parentId: null },
      ),
      block(
        "child",
        { left: 8, top: 40, right: 180, bottom: 80 },
        { contentRect: { left: 8, top: 40, right: 180, bottom: 80 }, parentId: "parent" },
      ),
      block(
        "sibling",
        { left: 8, top: 100, right: 180, bottom: 140 },
        { contentRect: { left: 8, top: 100, right: 180, bottom: 140 }, parentId: "parent" },
      ),
    ];
    assert.deepEqual(lassoSelection(nested, { left: 20, top: 50, right: 60, bottom: 70 }), [
      "child",
    ]);
  });

  it("drops every ancestor whose own content misses when a nested block intersects", () => {
    const nested = [
      block(
        "group",
        { left: 0, top: 0, right: 300, bottom: 300 },
        { contentRect: { left: 0, top: 0, right: 300, bottom: 16 }, parentId: null },
      ),
      block(
        "parent",
        { left: 12, top: 40, right: 280, bottom: 200 },
        { contentRect: { left: 12, top: 40, right: 280, bottom: 56 }, parentId: "group" },
      ),
      block(
        "child",
        { left: 24, top: 80, right: 200, bottom: 120 },
        { contentRect: { left: 24, top: 80, right: 200, bottom: 120 }, parentId: "parent" },
      ),
    ];
    assert.deepEqual(lassoSelection(nested, { left: 30, top: 90, right: 80, bottom: 110 }), [
      "child",
    ]);
  });

  it("omits a nested sibling outside the rectangle when parent content also intersects", () => {
    const nested = [
      block(
        "parent",
        { left: 0, top: 0, right: 200, bottom: 200 },
        { contentRect: { left: 0, top: 0, right: 200, bottom: 24 }, parentId: null },
      ),
      block(
        "child",
        { left: 8, top: 40, right: 180, bottom: 80 },
        { contentRect: { left: 8, top: 40, right: 180, bottom: 80 }, parentId: "parent" },
      ),
      block(
        "sibling",
        { left: 8, top: 120, right: 180, bottom: 160 },
        { contentRect: { left: 8, top: 120, right: 180, bottom: 160 }, parentId: "parent" },
      ),
    ];
    assert.deepEqual(lassoSelection(nested, { left: 0, top: 10, right: 40, bottom: 60 }), [
      "parent",
      "child",
    ]);
  });

  it("drops a containing block with no content box when a descendant intersects", () => {
    const nested = [
      block("parent", { left: 0, top: 0, right: 200, bottom: 160 }, { parentId: null }),
      block(
        "child",
        { left: 8, top: 40, right: 120, bottom: 80 },
        { contentRect: { left: 8, top: 40, right: 120, bottom: 80 }, parentId: "parent" },
      ),
    ];
    assert.deepEqual(lassoSelection(nested, { left: 10, top: 50, right: 40, bottom: 70 }), [
      "child",
    ]);
  });

  it("ignores a block that only shares an edge with the rectangle", () => {
    assert.equal(
      lassoSelection([block("edge", { left: 0, top: 0, right: 40, bottom: 20 })], {
        left: 40,
        top: 0,
        right: 80,
        bottom: 20,
      }),
      null,
    );
  });

  it("keeps a block whose own content intersects and no descendant does", () => {
    const nested = [
      block(
        "parent",
        { left: 0, top: 0, right: 200, bottom: 160 },
        { contentRect: { left: 0, top: 0, right: 200, bottom: 24 }, parentId: null },
      ),
      block(
        "child",
        { left: 8, top: 80, right: 120, bottom: 120 },
        { contentRect: { left: 8, top: 80, right: 120, bottom: 120 }, parentId: "parent" },
      ),
    ];
    assert.deepEqual(lassoSelection(nested, { left: 4, top: 4, right: 30, bottom: 18 }), [
      "parent",
    ]);
  });

  it("keeps a block whose own content intersects along with an intersecting descendant", () => {
    const nested = [
      block(
        "parent",
        { left: 0, top: 0, right: 200, bottom: 200 },
        { contentRect: { left: 0, top: 0, right: 200, bottom: 24 }, parentId: null },
      ),
      block(
        "child",
        { left: 8, top: 40, right: 180, bottom: 80 },
        { contentRect: { left: 8, top: 40, right: 180, bottom: 80 }, parentId: "parent" },
      ),
    ];
    assert.deepEqual(lassoSelection(nested, { left: 0, top: 10, right: 40, bottom: 60 }), [
      "parent",
      "child",
    ]);
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
  it("highlights intersecting note blocks and does not select editor text", () => {
    const gesture = read("../components/note/note-lasso.tsx");
    const css = read("../app/globals.css");
    const move = gesture.slice(gesture.indexOf("function onPointerMove"));
    const beforePrevent = move.slice(0, move.indexOf("event.preventDefault()"));
    assert.match(beforePrevent, /dragPastThreshold/);
    assert.equal(gesture.includes("setSelection"), false);
    assert.equal(gesture.includes("TextSelection"), false);
    assert.equal(gesture.includes("NodeSelection"), false);
    assert.match(gesture, /note-lasso-block/);
    assert.match(gesture, /lassoSelection/);
    assert.match(gesture, /collapseLeftoverSelection/);
    assert.equal(gesture.includes("editable"), false);
    assert.match(gesture, /pointer-events|note-lasso/);
    assert.match(gesture, /className="note-lasso"/);
    assert.match(css, /--note-lasso-fill:/);
    assert.match(css, /\.note-lasso \{[\s\S]*background: var\(--note-lasso-fill\)/);
    assert.match(css, /\.note-lasso-block[\s\S]*background: var\(--note-lasso-fill\)/);
  });

  it("paints during the drag, keeps a miss from clearing the previous highlight, and clears a click", () => {
    const gesture = read("../components/note/note-lasso.tsx");
    const css = read("../app/globals.css");
    const move = gesture.slice(gesture.indexOf("function onPointerMove"));
    const up = gesture.slice(gesture.indexOf("function onPointerUp"));
    assert.match(move, /lassoSelection\(blockBoxes\(root\), next\)/);
    assert.match(up, /if \(selection\) committedIds = selection/);
    assert.match(up, /show\(selection \?\? committedIds\)/);
    assert.match(up, /paintHighlight\(root, \[\]\)/);
    assert.match(css, /\.note-editor\.note-lasso-dragging \{\s*user-select: none;/);
    assert.match(gesture, /querySelectorAll<HTMLElement>\("\.bn-block\[data-id\]"\)/);
    assert.match(gesture, /child\.classList\.contains\("bn-block-content"\)/);
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
