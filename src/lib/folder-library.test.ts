import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  childFolders,
  documentsInFolder,
  folderMovesIntoItself,
  folderName,
  folderTrail,
  type FolderRecord,
} from "./folder-library.ts";

const share = {
  visibility: "private" as const,
  emails: [] as string[],
  hasPassword: false,
};
const notes: FolderRecord = {
  id: "notes",
  name: "Notes",
  parentId: null,
  workspaceId: null,
  sortIndex: 0,
  ...share,
};
const nested: FolderRecord = {
  id: "nested",
  name: "Nested",
  parentId: "notes",
  workspaceId: null,
  sortIndex: 1,
  ...share,
};
const team: FolderRecord = {
  id: "team",
  name: "Team",
  parentId: null,
  workspaceId: "ws-1",
  sortIndex: 0,
  ...share,
};

describe("folder library", () => {
  it("rejects an empty folder name and keeps a trimmed name", () => {
    assert.equal(folderName("  Field notes  "), "Field notes");
    assert.throws(() => folderName("   "), /Name the folder/);
    assert.throws(() => folderName(""), /Name the folder/);
    assert.throws(() => folderName("a".repeat(81)), /Name is too long/);
    assert.equal(folderName("a".repeat(80)), "a".repeat(80));
  });

  it("stops a folder from moving into itself or its own descendant", () => {
    const folders = [
      { id: "notes", parentId: null },
      { id: "nested", parentId: "notes" },
      { id: "deep", parentId: "nested" },
      { id: "other", parentId: null },
    ];

    assert.equal(folderMovesIntoItself(folders, "notes", null), false);
    assert.equal(folderMovesIntoItself(folders, "notes", "other"), false);
    assert.equal(folderMovesIntoItself(folders, "notes", "notes"), true);
    assert.equal(folderMovesIntoItself(folders, "notes", "nested"), true);
    assert.equal(folderMovesIntoItself(folders, "notes", "deep"), true);
    assert.equal(folderMovesIntoItself(folders, "nested", "notes"), false);
  });

  it("lists only the documents and folders at the open level", () => {
    const documents = [
      { id: "root-note", folderId: null },
      { id: "inside", folderId: "notes" },
      { id: "elsewhere", folderId: "team" },
    ];

    assert.deepEqual(
      documentsInFolder(documents, null).map((document) => document.id),
      ["root-note"],
    );
    assert.deepEqual(
      documentsInFolder(documents, "notes").map((document) => document.id),
      ["inside"],
    );
    assert.deepEqual(
      childFolders([notes, nested, team], "personal", null).map((folder) => folder.id),
      ["notes"],
    );
    assert.deepEqual(
      childFolders([notes, nested, team], "personal", "notes").map((folder) => folder.id),
      ["nested"],
    );
    assert.deepEqual(
      childFolders([notes, nested, team], "ws-1", null).map((folder) => folder.id),
      ["team"],
    );
  });

  it("builds a trail back to the library and drops a folder from another workspace", () => {
    assert.deepEqual(folderTrail([notes, nested, team], "nested", null), [
      { id: "notes", name: "Notes" },
      { id: "nested", name: "Nested" },
    ]);
    assert.deepEqual(folderTrail([notes, nested, team], null, null), []);
    assert.deepEqual(folderTrail([notes, nested, team], "team", null), []);
    assert.deepEqual(folderTrail([notes, nested, team], "missing", null), []);
  });

  it("keeps folder placement on the document and folder routes", () => {
    const schema = readFileSync(new URL("../db/schema.ts", import.meta.url), "utf8");
    const documents = schema.slice(
      schema.indexOf("export const documents"),
      schema.indexOf("export const documentShares"),
    );
    const route = readFileSync(new URL("../app/api/documents/route.ts", import.meta.url), "utf8");
    const move = readFileSync(new URL("../app/api/folders/move/route.ts", import.meta.url), "utf8");
    const store = readFileSync(new URL("./folders.ts", import.meta.url), "utf8");
    const board = readFileSync(
      new URL("../components/library/document-board.tsx", import.meta.url),
      "utf8",
    );
    const list = readFileSync(
      new URL("../components/library/library-documents.tsx", import.meta.url),
      "utf8",
    );

    assert.match(documents, /folderId: text\("folder_id"\)/);
    assert.match(route, /folderId: z\.string\(\)\.min\(1\)\.nullable\(\)\.optional\(\)/);
    assert.match(route, /moveDocumentToFolder\(user\.id, document\.id, input\.folderId\)/);
    assert.match(move, /moveFolder\(user\.id, input\.folderId, input\.parentId\)/);
    assert.match(store, /folderMovesIntoItself/);
    assert.match(store, /A folder cannot move into itself/);
    assert.ok(
      board.indexOf("const library = documentsInFolder(space, folderId)") <
        board.indexOf("libraryQueryMatches(item.title"),
    );
    assert.match(list, /filter === "all" \? childFolders/);
  });
});
