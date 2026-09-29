import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  blockMatchesAnyChoice,
  blockMatchesChoice,
  blocksToTurnInto,
  type TurnIntoBlock,
  type TurnIntoChoice,
} from "./turn-into.ts";

const choices: TurnIntoChoice[] = [
  { type: "paragraph" },
  { type: "heading", props: { level: 1, isToggleable: false } },
  { type: "heading", props: { level: 2, isToggleable: false } },
  { type: "heading", props: { level: 3, isToggleable: false } },
  { type: "heading", props: { level: 4, isToggleable: false } },
  { type: "heading", props: { level: 5, isToggleable: false } },
  { type: "heading", props: { level: 6, isToggleable: false } },
  { type: "heading", props: { level: 1, isToggleable: true } },
  { type: "heading", props: { level: 2, isToggleable: true } },
  { type: "heading", props: { level: 3, isToggleable: true } },
  { type: "quote" },
  { type: "toggleListItem" },
  { type: "bulletListItem" },
  { type: "numberedListItem" },
  { type: "checkListItem" },
];

function block(id: string, type: string, props: TurnIntoBlock["props"] = {}): TurnIntoBlock {
  return { id, type, props };
}

test("a choice matches only the same type and every listed prop", () => {
  const paragraph = block("p", "paragraph", { textColor: "red", backgroundColor: "blue" });
  assert.equal(blockMatchesChoice(paragraph, choices[0]), true);

  const heading = block("h", "heading", { level: 2, isToggleable: false, textColor: "red" });
  assert.equal(blockMatchesChoice(heading, choices[2]), true);
  assert.equal(blockMatchesChoice(heading, choices[1]), false);
  assert.equal(
    blockMatchesChoice(heading, { type: "heading", props: { level: 2, isToggleable: true } }),
    false,
  );

  const toggle = block("t", "heading", { level: 1, isToggleable: true });
  assert.equal(blockMatchesChoice(toggle, choices[7]), true);
  assert.equal(blockMatchesChoice(toggle, choices[1]), false);

  assert.equal(blockMatchesChoice(block("q", "quote"), { type: "quote", props: {} }), true);
  assert.equal(
    blockMatchesChoice(block("m", "heading", { level: 1 }), {
      type: "heading",
      props: { level: 1, isToggleable: false },
    }),
    false,
  );
  assert.equal(
    blockMatchesChoice(block("c", "checkListItem", { checked: true }), choices[14]),
    true,
  );
  assert.equal(
    blockMatchesChoice(block("c2", "checkListItem", { checked: false }), choices[14]),
    true,
  );
});

test("images, tables, code, and dividers match none of the text choices", () => {
  for (const type of ["image", "table", "codeBlock", "divider", "file", "video", "audio"]) {
    assert.equal(blockMatchesAnyChoice(block(type, type, { url: "x" }), choices), false, type);
  }

  assert.equal(blockMatchesAnyChoice(block("p", "paragraph"), choices), true);
  assert.equal(
    blockMatchesAnyChoice(block("h4", "heading", { level: 4, isToggleable: true }), choices),
    false,
  );
});

test("updates only the hovered block when it is outside the selection", () => {
  const hovered = block("hovered", "paragraph");
  const selected = [block("other", "paragraph"), block("image", "image")];

  assert.deepEqual(blocksToTurnInto(hovered, undefined, choices), [hovered]);
  assert.deepEqual(blocksToTurnInto(hovered, [], choices), [hovered]);
  assert.deepEqual(blocksToTurnInto(hovered, selected, choices), [hovered]);
  assert.equal(blocksToTurnInto(hovered, undefined, choices)[0], hovered);
});

test("updates every selected text block and leaves other blocks in the selection", () => {
  const paragraph = block("p", "paragraph", { textColor: "red" });
  const image = block("image", "image", { url: "pic" });
  const heading = block("h", "heading", { level: 3, isToggleable: false });
  const code = block("code", "codeBlock");
  const table = block("table", "table");
  const quote = block("q", "quote");
  const selected = [paragraph, image, heading, code, table, quote];

  const targets = blocksToTurnInto(heading, selected, choices);

  assert.deepEqual(
    targets.map((item) => item.id),
    ["p", "h", "q"],
  );
  assert.equal(targets[0], paragraph);
  assert.equal(targets[1], heading);
  assert.equal(targets[2], quote);
  assert.deepEqual(
    selected.map((item) => item.id),
    ["p", "image", "h", "code", "table", "q"],
  );
});

test("a selected non-text hovered block is not updated with the text blocks", () => {
  const image = block("image", "image");
  const paragraph = block("p", "paragraph");
  const targets = blocksToTurnInto(image, [image, paragraph, block("table", "table")], choices);

  assert.deepEqual(
    targets.map((item) => item.id),
    ["p"],
  );
});

test("the note editor keeps theme wiring and mounts one custom side menu", () => {
  const noteEditor = readFileSync(
    new URL("../components/note-editor.tsx", import.meta.url),
    "utf8",
  );
  const surface = readFileSync(
    new URL("../components/note/note-editor-surface.tsx", import.meta.url),
    "utf8",
  );
  const sideMenu = readFileSync(
    new URL("../components/note/note-side-menu.tsx", import.meta.url),
    "utf8",
  );
  const dragHandle = readFileSync(
    new URL("../components/note/note-drag-handle-menu.tsx", import.meta.url),
    "utf8",
  );
  const copyLink = readFileSync(
    new URL("../components/note/copy-block-link.tsx", import.meta.url),
    "utf8",
  );
  const menu = readFileSync(
    new URL("../components/note/turn-into-menu.tsx", import.meta.url),
    "utf8",
  );
  const choice = readFileSync(
    new URL("../components/note/turn-into-choice.tsx", import.meta.url),
    "utf8",
  );

  assert.match(noteEditor, /useSyncExternalStore/);
  assert.match(noteEditor, /matchMedia\("\(prefers-color-scheme: dark\)"\)/);
  assert.match(noteEditor, /return false/);
  assert.match(noteEditor, /theme=\{dark \? "dark" : "light"\}/);
  assert.match(noteEditor, /export function NoteEditor/);
  assert.match(surface, /sideMenu=\{false\}/);
  assert.match(surface, /<SideMenuController sideMenu=\{NoteSideMenu\} \/>/);
  assert.match(sideMenu, /<SideMenu dragHandleMenu=\{dragHandleMenu\} \/>/);
  assert.doesNotMatch(sideMenu, /<AddBlockButton/);
  assert.ok(dragHandle.indexOf("Turn into") < dragHandle.indexOf("Copy link to block"));
  assert.ok(dragHandle.indexOf("Copy link to block") < dragHandle.indexOf("delete_menuitem"));
  assert.match(dragHandle, /dict\.drag_handle\.delete_menuitem/);
  assert.match(copyLink, /useExtensionState\(SideMenuExtension/);
  assert.match(copyLink, /blockPermalink/);
  assert.match(copyLink, /publishNoteMarkdown/);
  assert.match(copyLink, /navigator\.clipboard\.writeText/);
  assert.match(copyLink, /copyToClipboard/);
  assert.doesNotMatch(noteEditor, /blocksToMarkdownLossy\(editor\.document\)/);
  assert.match(noteEditor, /setIdAttribute: true/);
  assert.match(noteEditor, /scrollIntoView\(\{ block: "center" \}\)/);
  assert.match(dragHandle, /dict\.drag_handle\.colors_menuitem/);
  assert.match(dragHandle, /dict\.drag_handle\.header_row_menuitem/);
  assert.match(dragHandle, /dict\.drag_handle\.header_column_menuitem/);
  assert.match(menu, /position="right"/);
  assert.match(menu, /sub=\{true\}/);
  assert.match(menu, /usePortalElement\(\)/);
  assert.match(menu, /blockTypeSelectItems\(editor\.dictionary\)/);
  assert.match(menu, /editorHasBlockWithType/);
  assert.match(menu, /blockMatchesAnyChoice/);
  assert.match(choice, /editor\.focus\(\)/);
  assert.match(choice, /editor\.transact\(\(\) =>/);
  assert.match(choice, /editor\.updateBlock/);
  assert.match(choice, /blocksToTurnInto/);
  assert.match(choice, /checked=\{checked\}/);
});
