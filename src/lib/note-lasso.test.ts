import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  collapseLeftoverSelection,
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
    assert.match(gesture, /note-lasso-highlight/);
    assert.match(gesture, /lassoSelection/);
    assert.match(gesture, /collapseLeftoverSelection/);
    assert.equal(gesture.includes("editable"), false);
    assert.match(gesture, /pointer-events|note-lasso/);
    assert.match(gesture, /className="note-lasso"/);
    assert.match(css, /--note-lasso-fill:/);
    assert.match(css, /\.note-lasso \{[\s\S]*background: var\(--note-lasso-fill\)/);
    assert.match(css, /\.note-lasso-highlight[\s\S]*background: var\(--note-lasso-fill\)/);
  });

  it("paints during the drag, keeps a miss from clearing the previous highlight, and clears a click", () => {
    const gesture = read("../components/note/note-lasso.tsx");
    const css = read("../app/globals.css");
    const move = gesture.slice(gesture.indexOf("function onPointerMove"));
    const up = gesture.slice(gesture.indexOf("function onPointerUp"));
    assert.match(move, /lassoSelection\(blockBoxes\(root\), next\)/);
    assert.match(up, /if \(selection\) committedIds = selection/);
    assert.match(up, /show\(selection \?\? committedIds\)/);
    assert.match(up, /paintHighlight\(root, highlightsRef\.current, \[\]\)/);
    assert.match(css, /\.note-editor\.note-lasso-dragging \{\s*user-select: none;/);
    assert.match(gesture, /querySelectorAll<HTMLElement>\("\.bn-block\[data-id\]"\)/);
    assert.match(gesture, /child\.classList\.contains\("bn-block-content"\)/);
  });

  it("moves the lasso through the element and collapses a leftover selection once", () => {
    const gesture = read("../components/note/note-lasso.tsx");
    const move = gesture.slice(gesture.indexOf("function onPointerMove"));
    const moveBody = move.slice(0, move.indexOf("function onPointerUp"));
    const show = gesture.slice(
      gesture.indexOf("function show"),
      gesture.indexOf("function clearDrag"),
    );
    assert.equal(gesture.includes("useState"), false);
    assert.equal(gesture.includes("setRect"), false);
    assert.match(gesture, /lassoRef/);
    assert.match(gesture, /node\.style\.left/);
    assert.match(gesture, /if \(collapsingSelection\) return/);
    assert.match(moveBody, /collapseEditorSelection\(editor\)/);
    assert.equal(
      moveBody.slice(moveBody.indexOf("event.preventDefault()")).includes("collapse"),
      false,
    );
    assert.equal(show.includes("collapse"), false);
  });

  it("washes only the innermost hovered block and keeps a lasso highlight", () => {
    const css = read("../app/globals.css");
    assert.match(
      css,
      /\.note-editor \.bn-block:hover:not\(:has\(\.bn-block:hover\)\) > \.bn-block-content \{\s*background: var\(--note-lasso-fill\);/,
    );
    assert.match(css, /\.note-lasso-highlight \{[\s\S]*background: var\(--note-lasso-fill\);/);
    assert.equal(css.includes("--note-hover-fill"), false);
  });

  it("collapses a leftover selection once and skips an empty or non-empty result", () => {
    const calls: number[] = [];
    collapseLeftoverSelection(undefined, () => {
      calls.push(0);
      return { empty: true };
    });
    collapseLeftoverSelection(null, () => {
      calls.push(1);
      return { empty: true };
    });

    const dispatched: { empty: boolean }[] = [];
    function view(empty: boolean) {
      return {
        state: {
          selection: { empty, from: 4 },
          doc: { resolve: (position: number) => position },
          tr: { setSelection: (selection: { empty: boolean }) => selection },
        },
        dispatch: (transaction: { empty: boolean }) => {
          dispatched.push(transaction);
        },
      };
    }

    collapseLeftoverSelection(view(true), () => ({ empty: true }));
    collapseLeftoverSelection(view(false), () => ({ empty: false }));
    collapseLeftoverSelection(view(false), (position: number) => ({ empty: true, position }));

    assert.deepEqual(calls, []);
    assert.deepEqual(dispatched, [{ empty: true, position: 4 }]);
  });

  it("prevents a text selection only for a lasso press and collapses once when the drag activates", () => {
    const gesture = read("../components/note/note-lasso.tsx");
    const down = gesture.slice(
      gesture.indexOf("function onPointerDown"),
      gesture.indexOf("function onPointerMove"),
    );
    const move = gesture.slice(
      gesture.indexOf("function onPointerMove"),
      gesture.indexOf("function onPointerUp"),
    );
    const show = gesture.slice(
      gesture.indexOf("function show"),
      gesture.indexOf("function cancelLassoFrame"),
    );
    const beforePrevent = down.slice(0, down.indexOf("event.preventDefault()"));
    assert.match(beforePrevent, /lassoStartAllowed/);
    assert.match(move, /collapseEditorSelection\(editor\)/);
    assert.match(move, /requestAnimationFrame/);
    assert.equal(show.includes("collapse"), false);
  });

  it("flushes the pending frame with the released rectangle and restores the highlight on cancel", () => {
    const gesture = read("../components/note/note-lasso.tsx");
    const up = gesture.slice(
      gesture.indexOf("function onPointerUp"),
      gesture.indexOf("function onPointerCancel"),
    );
    const cancel = gesture.slice(gesture.indexOf("function onPointerCancel"));
    const flush = up.slice(0, up.indexOf("const selection"));
    assert.match(flush, /cancelLassoFrame\(\)/);
    assert.match(flush, /rectFromPoints\(start, \{ x: event\.clientX, y: event\.clientY \}\)/);
    assert.match(up, /if \(selection\) committedIds = selection/);
    assert.match(up, /show\(selection \?\? committedIds\)/);
    assert.match(up, /clearHighlight\(\)/);
    assert.match(cancel, /paintHighlight\(root, highlightsRef\.current, committedIds\)/);
    assert.match(cancel, /cancelLassoFrame\(\)/);
  });

  it("blocks text selection for the armed gesture and fades the wash in after a document change", () => {
    const gesture = read("../components/note/note-lasso.tsx");
    const css = read("../app/globals.css");
    const show = gesture.slice(gesture.indexOf("function show"));
    const showBody = show.slice(0, show.indexOf("function clearHighlight"));
    const move = gesture.slice(
      gesture.indexOf("function onPointerMove"),
      gesture.indexOf("function onPointerUp"),
    );
    const activation = move.slice(
      move.indexOf("if (!active)"),
      move.indexOf("event.preventDefault()"),
    );
    const afterPrevent = move.slice(move.indexOf("event.preventDefault()"));
    assert.equal(showBody.includes("collapseEditorSelection"), false);
    assert.equal(showBody.includes("queueMicrotask"), false);
    assert.equal(showBody.includes("requestAnimationFrame"), false);
    assert.match(showBody, /highlightedIds = ids/);
    assert.match(showBody, /paintHighlight\(root, highlightsRef\.current, highlightedIds\)/);
    assert.match(activation, /clearDomSelection\(\)/);
    assert.equal(afterPrevent.includes("clearDomSelection"), false);
    assert.equal(afterPrevent.includes("removeAllRanges"), false);
    assert.match(gesture, /window\.getSelection\(\)/);
    assert.match(gesture, /removeAllRanges\(\)/);
    assert.equal(gesture.includes("MutationObserver"), false);
    assert.equal(gesture.includes("onSelectionChange"), false);
    assert.equal(gesture.includes("queueMicrotask"), false);
    assert.match(
      gesture,
      /function onSelectStart[\s\S]*if \(!armed\) return;\s*event\.preventDefault\(\)/,
    );
    assert.match(gesture, /editorRoot\.addEventListener\("selectstart", onSelectStart\)/);
    assert.match(gesture, /editorRoot\.addEventListener\("pointerdown", onPointerDown, true\)/);
    assert.match(gesture, /if \(paintingFromChange\) return/);
    assert.match(gesture, /editor\.onChange\(onDocumentChange\)/);
    assert.match(
      css,
      /\.note-editor\.note-lasso-dragging \* \{\s*user-select: none;\s*-webkit-user-select: none;/,
    );
    assert.match(css, /-webkit-user-select: none;/);
    const fill = css.slice(
      css.indexOf("--note-lasso-fill:"),
      css.indexOf("--note-lasso-fill:") + 200,
    );
    assert.match(fill, /10%/);
    assert.equal(fill.includes("22%"), false);
    assert.match(
      css,
      /@keyframes note-lasso-block-fade \{[\s\S]*from \{[\s\S]*opacity: 0;[\s\S]*to \{[\s\S]*opacity: 1;/,
    );
    assert.match(css, /animation: note-lasso-block-fade 200ms ease;/);
    assert.match(
      css,
      /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*\.note-lasso-highlight \{[\s\S]*animation: none;\s*opacity: 1;/,
    );
    assert.equal(css.includes(".note-lasso-block:not(:has(> .bn-block-content))"), false);
    const down = gesture.slice(gesture.indexOf("function onPointerDown"));
    const downBody = down.slice(0, down.indexOf("function onPointerMove"));
    assert.match(downBody, /classList\.add\("note-lasso-dragging"\)/);
    assert.match(downBody, /event\.stopPropagation\(\)/);
    assert.match(gesture, /classList\.remove\("note-lasso-dragging"\)/);
  });

  it("paints the drag highlight once per frame without watching selection or class mutations", () => {
    const gesture = read("../components/note/note-lasso.tsx");
    const move = gesture.slice(
      gesture.indexOf("function onPointerMove"),
      gesture.indexOf("function onPointerUp"),
    );
    const frame = move.slice(move.indexOf("requestAnimationFrame"));
    const down = gesture.slice(
      gesture.indexOf("function onPointerDown"),
      gesture.indexOf("function onPointerMove"),
    );
    const beforePrevent = down.slice(0, down.indexOf("event.preventDefault()"));
    const change = gesture.slice(
      gesture.indexOf("function onDocumentChange"),
      gesture.indexOf("const stopChange"),
    );
    assert.equal(move.match(/requestAnimationFrame/g)?.length, 1);
    assert.match(frame, /show\(lassoSelection\(blockBoxes\(root\), next\) \?\? \[\]\)/);
    assert.equal(frame.includes("clearDomSelection"), false);
    assert.equal(frame.includes("removeAllRanges"), false);
    assert.match(beforePrevent, /if \(start \|\| !lassoStartAllowed/);
    assert.match(beforePrevent, /return/);
    assert.equal(beforePrevent.includes("stopPropagation"), false);
    assert.match(change, /paintHighlight\(root, highlightsRef\.current, highlightedIds\)/);
    assert.equal(change.includes("lassoSelection"), false);
    assert.equal(change.includes("onSelectionChange"), false);
    assert.equal(gesture.includes("new MutationObserver"), false);
    assert.equal(gesture.includes("attributeFilter"), false);
  });

  it("fades the marquee in once and washes a contentless block from a transparent tint", () => {
    const gesture = read("../components/note/note-lasso.tsx");
    const css = read("../app/globals.css");
    const paint = gesture.slice(
      gesture.indexOf("function paintLasso"),
      gesture.indexOf("function collapseEditorSelection"),
    );
    assert.match(paint, /if \(!node\.classList\.contains\(MARQUEE_CLASS\)\)/);
    assert.match(paint, /node\.classList\.add\(MARQUEE_CLASS\)/);
    assert.equal(paint.includes("node.style.opacity"), false);
    assert.match(gesture, /contentRect \?\? box\.rect/);
    assert.match(
      css,
      /@keyframes note-lasso-marquee-fade \{[\s\S]*from \{[\s\S]*opacity: 0;[\s\S]*to \{[\s\S]*opacity: 1;/,
    );
    assert.match(css, /\.note-lasso \{[\s\S]*pointer-events: none;/);
    assert.match(
      css,
      /\.note-lasso\.note-lasso-visible \{[\s\S]*animation: note-lasso-marquee-fade 200ms ease both;/,
    );
    assert.match(
      css,
      /\.note-lasso-highlight \{[\s\S]*opacity: 1;\s*animation: note-lasso-block-fade 200ms ease;/,
    );
    assert.match(
      css,
      /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*\.note-lasso\.note-lasso-visible \{[\s\S]*animation: none;\s*opacity: 1;/,
    );
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
