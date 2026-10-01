import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function read(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("diagram lasso", () => {
  it("selects overlapping nodes with a pane lasso and keeps middle and right pan", () => {
    const canvas = read("../components/diagram/uml-canvas.tsx");
    assert.match(canvas, /import \{[\s\S]*SelectionMode,/);
    assert.match(canvas, /const panOnDrag = \[1, 2\];/);
    assert.match(canvas, /elementsSelectable/);
    assert.match(canvas, /selectionOnDrag/);
    assert.match(canvas, /selectionMode=\{SelectionMode\.Partial\}/);
    assert.match(canvas, /panOnDrag=\{panOnDrag\}/);
    assert.doesNotMatch(canvas, /selectionOnDrag=\{editable\}/);
    assert.doesNotMatch(canvas, /selectionMode=\{editable/);
  });

  it("records every dragged node and marks each one that moved", () => {
    const canvas = read("../components/diagram/uml-canvas.tsx");
    const start = canvas.slice(canvas.indexOf("onNodeDragStart"));
    const stop = start.slice(0, start.indexOf("onNodesDelete"));
    assert.match(stop, /const moving = dragged\.length > 0 \? dragged : \[node\]/);
    assert.match(stop, /dragOrigins\.current = new Map\(/);
    assert.match(stop, /for \(const item of moving\)/);
    assert.match(stop, /if \(!editable\) return/);
    assert.match(stop, /markNodeField\(dirty, item\.id, "position"\)/);
    assert.match(stop, /if \(moved\) schedule\(\)/);
    assert.equal(stop.includes("origin.id !== node.id"), false);
  });

  it("keeps read-only canvases from moving, connecting, or deleting", () => {
    const canvas = read("../components/diagram/uml-canvas.tsx");
    assert.match(canvas, /nodesDraggable=\{editable\}/);
    assert.match(canvas, /nodesConnectable=\{editable\}/);
    assert.match(canvas, /deleteKeyCode=\{editable \? \["Backspace", "Delete"\] : null\}/);
    assert.match(canvas, /<Controls \/>/);
    assert.match(canvas, /<MiniMap pannable zoomable \/>/);
    assert.match(canvas, /<DiagramPalette/);
  });

  it("leaves library document cards without a lasso", () => {
    const board = read("../components/library/document-board.tsx");
    const card = read("../components/library/document-card.tsx");
    assert.equal(board.includes("selectionOnDrag"), false);
    assert.equal(board.includes("ReactFlow"), false);
    assert.equal(card.includes("selectionOnDrag"), false);
    assert.equal(card.includes("ReactFlow"), false);
  });
});
