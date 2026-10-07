import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import type { NoteTitleRecord } from "./note-link.ts";
import {
  insertNotePageLink,
  noteLinkParagraph,
  notesForPageMenu,
  pageSlashMenuAliases,
  pageSlashMenuItem,
  pageSlashMenuTitle,
  slashMenuFillsCurrentBlock,
} from "./note-page.ts";

const notes: NoteTitleRecord[] = [
  { id: "diagram", title: "Map", type: "diagram", workspaceId: "ws-1" },
  { id: "other", title: "Budget", type: "note", workspaceId: "ws-2" },
  { id: "blank", title: "   ", type: "note", workspaceId: "ws-1" },
  { id: "zeta", title: "Zeta", type: "note", workspaceId: "ws-1" },
  { id: "alpha", title: "Alpha", type: "note", workspaceId: "ws-1" },
  { id: "personal", title: "Inbox", type: "note", workspaceId: null },
];

describe("page slash menu", () => {
  it("names the item Page and matches the page alias", () => {
    const item = pageSlashMenuItem(() => undefined);

    assert.equal(item.title, "Page");
    assert.equal(pageSlashMenuTitle, "Page");
    assert.deepEqual(item.aliases, ["page"]);
    assert.deepEqual(pageSlashMenuAliases, ["page"]);
    assert.equal(item.group, "Basic blocks");
  });

  it("lists notes from the current workspace and skips diagrams and blank titles", () => {
    assert.deepEqual(
      notesForPageMenu(notes, "ws-1").map((note) => note.id),
      ["alpha", "zeta"],
    );
    assert.deepEqual(
      notesForPageMenu(notes, null).map((note) => note.id),
      ["personal"],
    );
  });

  it("builds a noteLink paragraph from the chosen title", () => {
    assert.deepEqual(noteLinkParagraph("Alpha"), {
      type: "paragraph",
      content: [{ type: "noteLink", props: { title: "Alpha" } }],
    });
  });

  it("fills an empty paragraph and inserts after a paragraph that already has text", () => {
    assert.equal(slashMenuFillsCurrentBlock([]), true);
    assert.equal(slashMenuFillsCurrentBlock([{ type: "text", text: "/" }]), true);
    assert.equal(
      slashMenuFillsCurrentBlock([
        { type: "text", text: "Hello" },
        { type: "text", text: "/" },
      ]),
      false,
    );

    const updates: unknown[] = [];
    const inserts: unknown[] = [];
    const cursors: string[] = [];
    const editor = {
      getBlock: (id: string) => {
        if (id === "empty") return { id, content: [] };
        if (id === "slash") return { id, content: [{ type: "text", text: "/" }] };
        if (id === "full") return { id, content: [{ type: "text", text: "Hello" }] };
        return undefined;
      },
      updateBlock: (id: string, next: unknown) => {
        updates.push({ id, next });
        return { id, content: [] };
      },
      insertBlocks: (blocks: unknown[], id: string) => {
        inserts.push({ blocks, id });
        return [{ id: "new", content: [] }];
      },
      setTextCursorPosition: (id: string) => {
        cursors.push(id);
      },
    };

    assert.equal(insertNotePageLink(editor, "empty", "Alpha"), true);
    assert.equal(insertNotePageLink(editor, "slash", "Alpha"), true);
    assert.equal(insertNotePageLink(editor, "full", "Alpha"), true);
    assert.equal(insertNotePageLink(editor, "gone", "Alpha"), false);
    assert.equal(insertNotePageLink(editor, "full", "  "), false);
    assert.equal(updates.length, 2);
    assert.deepEqual(inserts, [
      {
        blocks: [noteLinkParagraph("Alpha")],
        id: "full",
      },
    ]);
    assert.deepEqual(cursors, ["empty", "slash", "new"]);
  });

  it("keeps Page in the slash menu that the insert button opens", () => {
    const menu = readFileSync(
      new URL("../components/note/note-slash-menu.tsx", import.meta.url),
      "utf8",
    );
    const surface = readFileSync(
      new URL("../components/note/note-editor-surface.tsx", import.meta.url),
      "utf8",
    );
    const picker = readFileSync(
      new URL("../components/note/note-page-picker-notes.tsx", import.meta.url),
      "utf8",
    );

    assert.match(menu, /triggerCharacter="\/"/);
    assert.match(menu, /getDefaultReactSlashMenuItems/);
    assert.match(menu, /pageSlashMenuItem/);
    assert.match(surface, /slashMenu=\{false\}/);
    assert.match(surface, /<NoteSlashMenu \/>/);
    assert.match(picker, /libraryItemsQueryOptions/);
    assert.match(picker, /useNoteWorkspace/);
    assert.match(picker, /notesForPageMenu/);
  });
});
