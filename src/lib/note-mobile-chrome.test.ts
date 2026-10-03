import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  blockIds,
  canDropBlock,
  dropPlacement,
  LONG_PRESS_MS,
  pointerMovedPastSlop,
} from "./note-block-drag.ts";
import {
  armResumeEditing,
  cancelResumeEditing,
  consumeResumeEditing,
  focusAfterMenuClose,
  inputModeWhileMenu,
} from "./note-menu-keyboard.ts";
import { NARROW_NOTE_QUERY } from "./note-narrow.ts";

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

describe("mobile note chrome", () => {
  it("closes the keyboard while a narrow menu is open and focuses only to resume editing", () => {
    assert.equal(inputModeWhileMenu(true, true), "none");
    assert.equal(inputModeWhileMenu(true, false), null);
    assert.equal(inputModeWhileMenu(false, true), null);
    assert.equal(focusAfterMenuClose(true), "focus");
    assert.equal(focusAfterMenuClose(false), "blur");

    cancelResumeEditing();
    assert.equal(consumeResumeEditing(), false);
    armResumeEditing();
    assert.equal(consumeResumeEditing(), true);
    assert.equal(consumeResumeEditing(), false);
    armResumeEditing();
    cancelResumeEditing();
    assert.equal(consumeResumeEditing(), false);
  });

  it("starts a block drag on a still long press and refuses a drop onto itself or a child", () => {
    assert.equal(LONG_PRESS_MS >= 400, true);
    assert.equal(pointerMovedPastSlop(0, 0, 4, 4), false);
    assert.equal(pointerMovedPastSlop(0, 0, 12, 0), true);
    assert.equal(dropPlacement(10, { top: 0, bottom: 40 }), "before");
    assert.equal(dropPlacement(30, { top: 0, bottom: 40 }), "after");

    const source = {
      id: "parent",
      children: [{ id: "child", children: [{ id: "nested" }] }],
    };
    assert.equal(canDropBlock(source, "parent"), false);
    assert.equal(canDropBlock(source, "child"), false);
    assert.equal(canDropBlock(source, "nested"), false);
    assert.equal(canDropBlock(source, "other"), true);
    assert.equal(blockIds([source]), "parent:child:nested:");
  });

  it("keeps the desktop side menu and removes its buttons on a narrow viewport", () => {
    const sideMenu = read("../components/note/note-side-menu.tsx");
    const css = read("../app/globals.css");
    const sheet = block(
      css.slice(css.lastIndexOf("@media (max-width: 760px)")),
      "@media (max-width: 760px) {",
    );

    assert.equal(NARROW_NOTE_QUERY, "(max-width: 760px)");
    assert.match(sideMenu, /if \(narrow\)/);
    assert.match(sideMenu, /<span hidden \/>/);
    assert.match(sideMenu, /<SideMenu dragHandleMenu=\{dragHandleMenu\} \/>/);
    assert.equal(/<AddBlockButton/.test(sideMenu), false);
    assert.equal(/<DragHandleButton/.test(sideMenu), false);
    assert.match(sheet, /\.bn-side-menu/);
    assert.match(sheet, /display:\s*none\s*!important/);
    assert.match(sheet, /pointer-events:\s*none\s*!important/);
  });

  it("drags from a long press without focusing the editor or opening the keyboard", () => {
    const source = read("../components/note/note-block-drag.tsx");

    assert.match(source, /LONG_PRESS_MS/);
    assert.match(source, /setAttribute\("inputmode", "none"\)/);
    assert.match(source, /hideSoftwareKeyboard\(\)/);
    assert.match(source, /sideMenu\.blockDragStart/);
    assert.match(source, /touchend/);
    assert.match(source, /passive: false/);
    assert.match(source, /event\.preventDefault\(\)/);
    assert.equal(/editor\.focus\(/.test(source), false);
    assert.match(source, /if \(!narrow \|\| !editable\) return/);
  });

  it("puts insert-block on the mobile formatting toolbar and opens the slash menu with the keyboard closed", () => {
    const button = read("../components/note/note-insert-block-button.tsx");
    const toolbar = read("../components/note/note-formatting-toolbar.tsx");
    const surface = read("../components/note/note-editor-surface.tsx");
    const keyboard = read("../components/note/note-menu-keyboard.tsx");
    const turnInto = read("../components/note/turn-into-choice.tsx");

    assert.match(button, /if \(!Components \|\| !narrow\) return null/);
    assert.match(button, /FormattingToolbar\.Button/);
    assert.match(button, /openSuggestionMenu\("\/"\)/);
    assert.match(button, /setAttribute\("inputmode", "none"\)/);
    assert.equal(/editor\.focus\(/.test(button), false);
    assert.match(toolbar, /<NoteInsertBlockButton \/>/);
    assert.match(toolbar, /getFormattingToolbarItems\(\)/);
    assert.match(surface, /formattingToolbar=\{false\}/);
    assert.match(surface, /<NoteFormattingToolbarController \/>/);
    assert.match(surface, /<NoteMenuKeyboard \/>/);
    assert.match(surface, /<NoteBlockDrag editable=\{editable\} \/>/);
    assert.match(keyboard, /inputModeWhileMenu/);
    assert.match(keyboard, /focusAfterMenuClose/);
    assert.match(keyboard, /setAttribute\("inputmode", "none"\)/);
    assert.match(turnInto, /NARROW_NOTE_QUERY/);
    assert.match(
      turnInto,
      /if \(!window\.matchMedia\(NARROW_NOTE_QUERY\)\.matches\) editor\.focus\(\)/,
    );
  });
});
