import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  blockIdsFromEditorSelection,
  editorHasNoteFocus,
  focusedBlockIds,
  isSelectAllShortcut,
  nestedBlockId,
  selectAllBlockIds,
  selectAllCopyKind,
  selectedNodeBlockId,
} from "./note-select-all.ts";

function element(input: {
  classes?: string[];
  children?: Element[];
  closest?: Record<string, Element | null>;
  attrs?: Record<string, string | null>;
  selected?: Element | null;
}) {
  const node = {
    classList: {
      contains(name: string) {
        return (input.classes ?? []).includes(name);
      },
    },
    contains(child: Element) {
      return (input.children ?? []).includes(child);
    },
    closest(selector: string) {
      return input.closest?.[selector] ?? null;
    },
    getAttribute(name: string) {
      return input.attrs?.[name] ?? null;
    },
    querySelector() {
      return input.selected ?? null;
    },
  };
  return node as unknown as Element;
}

describe("select-all copy", () => {
  it("accepts command and control A, and ignores chords that are not select-all", () => {
    assert.equal(
      isSelectAllShortcut({
        key: "a",
        metaKey: true,
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
      }),
      true,
    );
    assert.equal(
      isSelectAllShortcut({
        key: "A",
        metaKey: false,
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
      }),
      true,
    );
    assert.equal(
      isSelectAllShortcut({
        key: "a",
        metaKey: true,
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
      }),
      true,
    );
    assert.equal(
      isSelectAllShortcut({
        key: "a",
        metaKey: false,
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
      }),
      false,
    );
    assert.equal(
      isSelectAllShortcut({
        key: "a",
        metaKey: true,
        ctrlKey: false,
        altKey: true,
        shiftKey: false,
      }),
      false,
    );
    assert.equal(
      isSelectAllShortcut({
        key: "a",
        metaKey: true,
        ctrlKey: false,
        altKey: false,
        shiftKey: true,
      }),
      false,
    );
    assert.equal(
      isSelectAllShortcut({
        key: "c",
        metaKey: true,
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
      }),
      false,
    );
  });

  it("copies the focused block instead of the note, and the note when no block is focused", () => {
    assert.equal(selectAllCopyKind({ noteFocused: true, blockFocused: true }), "block");
    assert.equal(selectAllCopyKind({ noteFocused: true, blockFocused: false }), "note");
    assert.equal(selectAllCopyKind({ noteFocused: false, blockFocused: true }), "block");
    assert.equal(selectAllCopyKind({ noteFocused: false, blockFocused: false }), null);
  });

  it("reads a selected block id and ignores a text selection", () => {
    assert.deepEqual(blockIdsFromEditorSelection({ node: { attrs: { id: "block-1" } } }), [
      "block-1",
    ]);
    assert.deepEqual(
      blockIdsFromEditorSelection({
        nodes: [
          { attrs: { id: "block-1" } },
          { attrs: { id: "block-2" } },
          { attrs: { id: "block-1" } },
        ],
      }),
      ["block-1", "block-2"],
    );
    assert.deepEqual(blockIdsFromEditorSelection({ node: { attrs: { id: 4 } } }), []);
    assert.deepEqual(blockIdsFromEditorSelection({}), []);
    assert.deepEqual(blockIdsFromEditorSelection(null), []);
  });

  it("treats a focused element inside a block as that block, and the editor surface as the note", () => {
    const block = element({ attrs: { "data-id": "para" } });
    const editor = element({ classes: ["bn-editor"], children: [] });
    const nested = element({ closest: { ".bn-block[data-id]": block } });
    Object.assign(editor, {
      contains(child: Element) {
        return child === nested;
      },
    });

    assert.equal(nestedBlockId(nested, editor), "para");
    assert.equal(nestedBlockId(editor, editor), null);
    assert.equal(
      editorHasNoteFocus({ viewFocused: true, active: editor, editorDom: editor }),
      true,
    );
    assert.equal(
      editorHasNoteFocus({ viewFocused: false, active: editor, editorDom: editor }),
      true,
    );
    assert.equal(
      editorHasNoteFocus({ viewFocused: false, active: element({}), editorDom: editor }),
      false,
    );

    const selected = element({ attrs: { "data-id": "image" } });
    const host = element({
      selected: element({ closest: { ".bn-block[data-id]": selected } }),
    });
    assert.equal(selectedNodeBlockId(host), "image");
    assert.equal(selectedNodeBlockId(element({})), null);

    assert.deepEqual(
      focusedBlockIds({
        selection: { node: { attrs: { id: "node" } } },
        active: nested,
        editorDom: editor,
      }),
      ["node"],
    );
    assert.deepEqual(focusedBlockIds({ selection: {}, active: nested, editorDom: editor }), [
      "para",
    ]);
    assert.deepEqual(focusedBlockIds({ selection: {}, active: editor, editorDom: editor }), []);
  });

  it("copies the caret block, and the whole note when the selection spans more than one block", () => {
    assert.deepEqual(
      selectAllBlockIds({ selectedIds: [], cursorBlockId: "para", spannedBlockCount: 0 }),
      ["para"],
    );
    assert.deepEqual(
      selectAllBlockIds({ selectedIds: ["image"], cursorBlockId: "para", spannedBlockCount: 0 }),
      ["image"],
    );
    assert.deepEqual(
      selectAllBlockIds({ selectedIds: ["image"], cursorBlockId: "para", spannedBlockCount: 2 }),
      [],
    );
    assert.deepEqual(
      selectAllBlockIds({ selectedIds: [], cursorBlockId: null, spannedBlockCount: 0 }),
      [],
    );
  });
});

describe("select-all wiring", () => {
  it("copies from the open note on select-all and lets a focused block replace the note copy", () => {
    const editor = readFileSync(new URL("../components/note-editor.tsx", import.meta.url), "utf8");
    const bind = readFileSync(
      new URL("../components/note/note-select-all.ts", import.meta.url),
      "utf8",
    );

    assert.match(editor, /bindNoteSelectAll\(editor, \(\) => storedMarkdown\(\)\)/);
    assert.match(bind, /addEventListener\("keydown", onKeyDown, true\)/);
    assert.match(bind, /event\.preventDefault\(\)/);
    assert.match(bind, /event\.stopPropagation\(\)/);
    assert.match(bind, /selectAllCopyKind/);
    assert.match(bind, /selectAllBlockIds/);
    assert.match(bind, /getTextCursorPosition\(\)/);
    assert.match(bind, /noteExportMarkdown\(readMarkdown\(\)\)/);
    assert.match(bind, /readableBlockMarkdown\(marked\)/);
    assert.match(bind, /HTMLTextAreaElement/);
    assert.equal(
      bind.indexOf('kind === "block"'),
      bind.indexOf("noteExportMarkdown(readMarkdown())") > 0
        ? bind.indexOf('kind === "block"')
        : -1,
    );
    assert.ok(
      bind.indexOf('kind === "block"') < bind.indexOf("noteExportMarkdown(readMarkdown())"),
    );
  });
});
