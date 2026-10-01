import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function read(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

function block(source: string, start: string, end: string) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `${start} .. ${end}`);
  return source.slice(from, to);
}

describe("markdown block menu stacking", () => {
  it("paints the drag-handle menu above the left sidebar while it is open", () => {
    const css = read("../app/globals.css");
    const sidebar = block(css, ".library-shell > .library-sidebar {", ".library-mobile-header {");
    const drawer = block(
      css,
      ".library-shell > .library-sidebar {\n    position: fixed;",
      ".library-shell > .library-sidebar.is-open",
    );
    const raised = block(
      css,
      ".library-shell:has(.bn-drag-handle-menu) > .library-main {",
      ".library-shell ::selection",
    );
    const resting = block(
      css,
      ".library-shell > .library-main,\n.library-shell > .library-status {",
      ".library-shell:has(.doc-menu .menu-panel) > .library-main",
    );

    assert.match(sidebar, /z-index:\s*2/);
    assert.match(drawer, /z-index:\s*5/);
    assert.match(resting, /z-index:\s*1/);
    assert.match(raised, /z-index:\s*6/);
    assert.equal(/position:\s*relative/.test(resting), true);
    assert.equal(/\.bn-suggestion-menu/.test(raised), false);
    assert.equal(/\.library-sidebar/.test(raised), false);
  });
});
