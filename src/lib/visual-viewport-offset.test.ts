import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { readStylesheet } from "./stylesheet.ts";
import {
  clearVisualViewportOffset,
  visualViewportBox,
  writeVisualViewportOffset,
} from "./visual-viewport-offset.ts";

function read(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("visual viewport offset", () => {
  it("tracks the visible viewport so chrome can stay put while the keyboard is open", () => {
    const open = visualViewportBox(
      { height: 420, offsetLeft: 2, offsetTop: 88, scale: 1, width: 390 },
      { height: 800, width: 390 },
    );
    const closed = visualViewportBox(null, { height: 700, width: 360 });
    assert.deepEqual(open, {
      height: 420,
      offsetLeft: 2,
      offsetTop: 88,
      scale: 1,
      width: 390,
    });
    assert.equal(closed.offsetTop, 0);
    assert.equal(closed.height, 700);

    const props = new Map<string, string>();
    const element = {
      style: {
        removeProperty(name: string) {
          props.delete(name);
        },
        setProperty(name: string, value: string) {
          props.set(name, value);
        },
      },
    } as unknown as HTMLElement;

    writeVisualViewportOffset(element, open);
    assert.equal(props.get("--bn-vv-top"), "88px");
    assert.equal(props.get("--bn-vv-height"), "420px");
    clearVisualViewportOffset(element);
    assert.equal(props.has("--bn-vv-top"), false);
    assert.equal(props.has("--bn-vv-scale"), false);
  });

  it("pins the note header and the item edit menu in that order", () => {
    const css = readStylesheet();
    const header = read("../components/library/library-mobile-header.tsx");
    const toolbar = read("../components/note/note-formatting-toolbar-controller.tsx");
    const mobile = read("../components/note/note-mobile-formatting-toolbar.tsx");
    const narrow = css.slice(css.lastIndexOf("@media (max-width: 760px)"));
    const wide = css.slice(css.lastIndexOf("@media (min-width: 761px)"));

    assert.match(header, /bindVisualViewportOffset/);
    assert.match(toolbar, /className: "note-edit-menu"/);
    assert.match(mobile, /querySelector\("\.library-shell"\)/);
    assert.match(narrow, /\.library-shell\s*\{[^}]*top:\s*var\(--bn-vv-top, 0px\)/);
    assert.match(narrow, /\.library-mobile-header\s*\{[^}]*position:\s*fixed/);
    assert.match(narrow, /\.library-mobile-header\s*\{[^}]*top:\s*var\(--bn-vv-top, 0px\)/);
    assert.match(narrow, /\.library-shell \.bn-mobile-formatting-toolbar/);
    assert.match(narrow, /\.library-shell \.note-edit-menu/);
    assert.match(narrow, /top:\s*calc\(var\(--bn-vv-top, 0px\) \+ 56px\) !important/);
    assert.match(wide, /top:\s*calc\(var\(--bn-vv-top, 0px\) \+ 56px\) !important/);
    assert.match(wide, /translateY\(var\(--bn-vv-top, 0px\)\)/);
  });
});
