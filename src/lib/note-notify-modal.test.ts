import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("note notify phone modal", () => {
  it("portals the phone dialog onto the library shell and leaves the wide popover in the bell anchor", () => {
    const dialog = source("../components/note-notify/note-notify-dialog.tsx");
    const layer = source("../components/note-notify/note-notify-layer.tsx");
    const panel = source("../components/note-notify/note-notify-panel.tsx");
    const portal = source("../components/library/document-share-portal.tsx");
    const css = source("../app/globals.css");
    const phone = dialog.slice(dialog.indexOf("if (narrow)"), dialog.lastIndexOf("return ("));
    const wide = dialog.slice(dialog.lastIndexOf("return ("));

    assert.match(dialog, /max-width: 760px/);
    assert.match(phone, /<DocumentSharePortal>/);
    assert.match(phone, /\bmodal\b/);
    assert.equal(wide.includes("DocumentSharePortal"), false);
    assert.match(wide, /modal=\{false\}/);
    assert.match(portal, /querySelector\("\.library-shell"\)/);
    assert.match(portal, /document\.body/);
    assert.match(layer, /dialog\?\.contains\(target\)/);
    assert.match(layer, /if \(event\.target !== event\.currentTarget\) return/);
    assert.match(layer, /event\.key === "Escape"/);
    assert.match(panel, /aria-modal=\{modal\}/);
    assert.match(css, /\.library-shell \.note-notify-layer \{[^}]*position: fixed/s);
    assert.match(css, /\.library-shell \.note-notify-layer \{[^}]*inset: 0/s);
    assert.match(css, /max-height: calc\(100dvh - 32px\)/);
    assert.match(
      css,
      /@media \(min-width: 761px\) \{[\s\S]*\.note-notify-anchor \.note-notify-layer \{[^}]*position: absolute/s,
    );
    assert.match(
      css,
      /@media \(min-width: 761px\) \{[\s\S]*\.note-notify-anchor \.note-notify-layer \{[^}]*background: transparent/s,
    );
    assert.match(css, /\.library-shell \.note-notify-layer \{[^}]*z-index: 40/s);
  });
});
