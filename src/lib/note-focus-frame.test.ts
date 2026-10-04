import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { readStylesheet } from "./stylesheet.ts";

function read(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

function block(source: string, header: string) {
  const at = source.indexOf(header);
  assert.ok(at >= 0, header);
  const open = source.indexOf("{", at);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    const character = source[index];
    if (character === "{") depth += 1;
    else if (character === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(at, index + 1);
    }
  }
  assert.fail(`unclosed ${header}`);
}

describe("open document focus frame", () => {
  const css = readStylesheet();

  it("keeps the lime focus ring on library controls", () => {
    const focus = block(css, ".library-shell :focus-visible {");

    assert.match(focus, /outline:\s*2px solid var\(--home-lime\);/);
    assert.match(focus, /outline-offset:\s*2px;/);
  });

  it("drops the lime frame on the focused document surface", () => {
    const surface = block(css, ".library-shell .note-sheet:focus,");

    assert.match(surface, /\.library-shell \.note-sheet:focus-visible,/);
    assert.match(surface, /\.library-shell \.note-editor \.bn-editor:focus,/);
    assert.match(surface, /\.library-shell \.note-editor \.bn-editor:focus-visible,/);
    assert.match(surface, /\.library-shell \.note-sheet \[contenteditable="true"\]:focus,/);
    assert.match(
      surface,
      /\.library-shell \.note-sheet \[contenteditable="true"\]:focus-visible \{/,
    );
    assert.match(surface, /outline:\s*none;/);
    assert.doesNotMatch(surface, /button|menu-item|\.btn|:is\(a|\binput\b|textarea|summary/);
  });

  it("keeps the heading title field focus ring", () => {
    const title = block(css, ".library-shell .library-heading .note-title-input:focus,");

    assert.match(title, /\.note-title-input:focus-visible,/);
    assert.match(title, /outline:\s*2px solid var\(--home-lime\);/);
  });
});
