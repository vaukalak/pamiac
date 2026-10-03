import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

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

function sheetMedia() {
  const css = read("../app/globals.css");
  return block(
    css.slice(css.lastIndexOf("@media (max-width: 760px)")),
    "@media (max-width: 760px) {",
  );
}

describe("mobile block menu sheets", () => {
  it("pins the drag-handle, turn-into, and block color menus to the bottom sheet", () => {
    const sheet = sheetMedia();
    const menus = block(
      sheet,
      ".library-shell .note-editor .bn-drag-handle-menu,\n  .library-shell .note-editor .note-turn-into-menu,\n  .library-shell .note-editor .bn-drag-handle-menu .bn-color-picker-dropdown {",
    );

    assert.match(menus, /position:\s*fixed\s*!important/);
    assert.match(
      menus,
      /bottom:\s*calc\(100dvh - var\(--bn-vv-top, 0px\) - var\(--bn-vv-height, 100dvh\)\)\s*!important/,
    );
    assert.match(menus, /left:\s*var\(--bn-vv-left, 0px\)\s*!important/);
    assert.match(menus, /right:\s*auto\s*!important/);
    assert.match(menus, /top:\s*auto\s*!important/);
    assert.match(menus, /transform:\s*none\s*!important/);
    assert.equal(/\btranslate\s*:/.test(menus), false);
    assert.equal(/\b(rotate|scale)\s*:/.test(menus), false);
    assert.match(menus, /width:\s*var\(--bn-vv-width, 100%\)\s*!important/);
    assert.match(menus, /max-height:\s*min\(70dvh, var\(--bn-vv-height, 70dvh\)\)\s*!important/);
    assert.match(menus, /overflow-y:\s*auto\s*!important/);
    assert.match(menus, /border-radius:\s*16px 16px 0 0\s*!important/);
    assert.match(menus, /padding-bottom:\s*max\(8px, env\(safe-area-inset-bottom\)\)/);
    assert.match(menus, /\.note-turn-into-menu/);
    assert.match(menus, /\.bn-drag-handle-menu \.bn-color-picker-dropdown/);
    assert.equal(/^\.library-shell \.note-editor \.bn-color-picker-dropdown/m.test(menus), false);
  });

  it("stacks an open submenu above the drag-handle sheet without pinning the toolbar color menu", () => {
    const sheet = sheetMedia();
    const header =
      ".library-shell .note-editor .note-turn-into-menu,\n  .library-shell .note-editor .bn-drag-handle-menu .bn-color-picker-dropdown {";
    const raised = block(sheet.slice(sheet.lastIndexOf(header)), header);
    let sawColorPicker = false;
    for (const chunk of sheet.split("}")) {
      const brace = chunk.indexOf("{");
      if (brace < 0 || !chunk.slice(0, brace).includes(".bn-color-picker-dropdown")) continue;
      sawColorPicker = true;
      for (const part of chunk.slice(0, brace).split(",")) {
        if (!part.includes(".bn-color-picker-dropdown")) continue;
        assert.match(part, /\.bn-drag-handle-menu/);
      }
    }

    assert.match(raised, /z-index:\s*90\s*!important/);
    assert.equal(sawColorPicker, true);
    assert.equal(/bn-formatting-toolbar/.test(sheet), false);
    assert.equal(/bn-table-handle-menu/.test(sheet), false);
  });

  it("dims the page and lifts the shell while a block menu is open", () => {
    const sheet = sheetMedia();
    const backdrop = block(sheet, ".library-shell .note-editor .note-block-menu-backdrop {");
    const shell = block(
      sheet,
      ".library-shell:has(.note-editor .bn-drag-handle-menu),\n  .library-shell:has(.note-editor .note-turn-into-menu),\n  .library-shell:has(.note-editor .bn-drag-handle-menu .bn-color-picker-dropdown) {",
    );
    const css = read("../app/globals.css");
    const desktop = css.slice(
      css.indexOf(".library-shell:has(.bn-drag-handle-menu) > .library-main {"),
      css.indexOf(".library-shell ::selection"),
    );

    assert.match(backdrop, /background:\s*var\(--scrim\)/);
    assert.match(backdrop, /position:\s*fixed/);
    assert.match(backdrop, /inset:\s*0/);
    assert.match(shell, /z-index:\s*50/);
    assert.match(desktop, /z-index:\s*6/);
    assert.equal(/@media/.test(desktop), false);
  });

  it("releases the side-menu transform so the sheet is not trapped on the caret", () => {
    const sheet = sheetMedia();
    const wrapper = block(
      sheet,
      ".library-shell .note-editor div:has(> .bn-portal-anchor-holder .bn-drag-handle-menu) {",
    );

    assert.match(wrapper, /position:\s*static\s*!important/);
    assert.match(wrapper, /transform:\s*none\s*!important/);
    assert.match(wrapper, /will-change:\s*auto\s*!important/);
    assert.equal(/\btranslate\s*:/.test(wrapper), false);
    assert.equal(/\b(rotate|scale)\s*:/.test(wrapper), false);
  });

  it("closes from the backdrop on a narrow viewport and unfreezes only after the menu leaves", () => {
    const source = read("../components/note/note-block-menu-sheet.tsx");
    const surface = read("../components/note/note-editor-surface.tsx");
    const turnInto = read("../components/note/turn-into-list.tsx");

    assert.match(source, /NARROW_QUERY = "\(max-width: 760px\)"/);
    assert.match(source, /\.bn-drag-handle-menu/);
    assert.match(source, /\.note-turn-into-menu/);
    assert.match(source, /\.bn-drag-handle-menu \.bn-color-picker-dropdown/);
    assert.match(source, /event\.preventDefault\(\)/);
    assert.equal(/stopPropagation/.test(source), false);
    assert.match(source, /new MouseEvent\("mousedown"/);
    assert.match(source, /editor\.blur\(\)/);
    assert.equal(/editor\.focus\(\)/.test(source), false);
    assert.match(source, /!menu\.isConnected/);
    assert.match(source, /sideMenu\.unfreezeMenu\(\)/);
    assert.match(source, /className="note-block-menu-backdrop"/);
    assert.match(surface, /<NoteBlockMenuSheet \/>/);
    assert.match(turnInto, /note-turn-into-menu/);
    assert.equal(/bn-formatting-toolbar/.test(source), false);
  });
});
