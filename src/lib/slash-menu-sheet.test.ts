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

describe("mobile slash menu sheet", () => {
  it("pins the slash menu to the bottom of a narrow viewport", () => {
    const css = readStylesheet();
    const sheet = block(
      css.slice(css.lastIndexOf("@media (max-width: 760px)")),
      "@media (max-width: 760px) {",
    );
    const menu = block(
      sheet,
      ".library-shell .note-editor .bn-suggestion-menu,\n  .library-shell .note-editor .bn-select {",
    );
    const shell = block(sheet, ".library-shell .note-editor div:has(> .bn-suggestion-menu) {");

    assert.match(menu, /position:\s*fixed\s*!important/);
    assert.match(
      menu,
      /bottom:\s*calc\(var\(--note-keyboard-inset, 0px\) \+ var\(--note-formatting-bar, 0px\)\)\s*!important/,
    );
    assert.match(menu, /left:\s*var\(--bn-vv-left, 0px\)\s*!important/);
    assert.match(menu, /right:\s*auto\s*!important/);
    assert.match(menu, /top:\s*auto\s*!important/);
    assert.match(menu, /transform:\s*none\s*!important/);
    assert.equal(/\btranslate\s*:/.test(menu), false);
    assert.match(menu, /width:\s*var\(--bn-vv-width, 100%\)\s*!important/);
    assert.match(menu, /max-height:\s*min\(70dvh, var\(--bn-vv-height, 70dvh\)\)\s*!important/);
    assert.match(menu, /overflow-y:\s*auto\s*!important/);
    assert.match(menu, /border-radius:\s*16px 16px 0 0\s*!important/);
    assert.match(shell, /transform:\s*none\s*!important/);
    assert.equal(/\btranslate\s*:/.test(shell), false);
    assert.match(shell, /position:\s*static\s*!important/);
    assert.equal(/\.bn-drag-handle-menu/.test(menu), false);
    assert.equal(/\.bn-drag-handle-menu/.test(shell), false);
    assert.equal(/bn-formatting-toolbar/.test(sheet), false);
    assert.equal(/bn-grid-suggestion-menu/.test(sheet), false);
  });

  it("does not make the floating wrapper a transform containing block", () => {
    const css = readStylesheet();
    const sheet = block(
      css.slice(css.lastIndexOf("@media (max-width: 760px)")),
      "@media (max-width: 760px) {",
    );
    const menu = block(
      sheet,
      ".library-shell .note-editor .bn-suggestion-menu,\n  .library-shell .note-editor .bn-select {",
    );
    const shell = block(sheet, ".library-shell .note-editor div:has(> .bn-suggestion-menu) {");

    assert.match(shell, /will-change:\s*auto\s*!important/);
    assert.equal(/\b(rotate|scale)\s*:/.test(menu), false);
    assert.equal(/\b(rotate|scale)\s*:/.test(shell), false);
  });

  it("dims the screen with the library scrim and lifts the sheet above the header", () => {
    const css = readStylesheet();
    const sheet = block(
      css.slice(css.lastIndexOf("@media (max-width: 760px)")),
      "@media (max-width: 760px) {",
    );
    const backdrop = block(sheet, ".library-shell .note-editor .note-slash-backdrop {");
    const raised = block(
      sheet,
      ".library-shell:has(.note-editor .bn-suggestion-menu) > .library-main {",
    );
    const shell = block(sheet, ".library-shell:has(.note-editor .bn-suggestion-menu) {");

    assert.match(backdrop, /background:\s*var\(--scrim\)/);
    assert.match(backdrop, /position:\s*fixed/);
    assert.match(backdrop, /inset:\s*0/);
    assert.match(raised, /z-index:\s*8/);
    assert.match(shell, /z-index:\s*50/);
  });

  it("closes only the open slash menu from the backdrop on a narrow viewport", () => {
    const source = read("../components/note/note-slash-menu-sheet.tsx");
    const surface = read("../components/note/note-editor-surface.tsx");

    assert.match(source, /NARROW_QUERY = "\(max-width: 760px\)"/);
    assert.match(source, /state\?\.show && state\.triggerCharacter === "\/"/);
    assert.match(source, /suggestionMenu\.closeMenu\(\)/);
    assert.match(source, /editor\.blur\(\)/);
    assert.equal(/editor\.focus\(\)/.test(source), false);
    assert.match(source, /className="note-slash-backdrop"/);
    assert.match(surface, /<NoteSlashMenuSheet \/>/);
    assert.equal(/bn-drag-handle-menu/.test(source), false);
  });
});
