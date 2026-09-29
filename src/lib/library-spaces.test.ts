import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  documentsInSpace,
  firstMember,
  librarySpaces,
  openLibraryId,
  PERSONAL_SPACE_ID,
  placeDocument,
  workspaceName,
  workspacePerson,
} from "./library-spaces.ts";

describe("library personal space", () => {
  it("lists one personal space and not an organization", () => {
    const spaces = librarySpaces();
    assert.equal(spaces.length, 1);
    assert.deepEqual(spaces[0], { id: PERSONAL_SPACE_ID, label: "Personal space" });
    assert.equal(Object.hasOwn(spaces[0] ?? {}, "invite"), false);
    assert.doesNotMatch(spaces[0]?.label ?? "", /organi[sz]ation|company|team/i);
  });

  it("shows the same documents when the personal space is selected", () => {
    const documents = [
      { id: "note-1", type: "note" },
      { id: "diagram-2", type: "diagram" },
    ];
    const shown = documentsInSpace(PERSONAL_SPACE_ID, documents);
    assert.equal(shown, documents);
    assert.deepEqual(
      shown.map((document) => document.id),
      ["note-1", "diagram-2"],
    );
  });

  it("keeps that library when the choice is the listed personal space", () => {
    const documents = [{ id: "a" }, { id: "b" }];
    const [space] = librarySpaces();
    assert.ok(space);
    assert.equal(space.id, PERSONAL_SPACE_ID);
    assert.equal(documentsInSpace(space.id, documents), documents);
  });

  it("does not invite anyone into the personal space", () => {
    const selector = readFileSync(
      new URL("../components/library/workspace-selector.tsx", import.meta.url),
      "utf8",
    );
    const board = readFileSync(
      new URL("../components/library/document-board.tsx", import.meta.url),
      "utf8",
    );
    const create = readFileSync(
      new URL("../components/library/workspace-create.tsx", import.meta.url),
      "utf8",
    );
    assert.equal(/invite/i.test(selector), false);
    assert.equal(/invite/i.test(board), false);
    assert.equal(/invite/i.test(create), false);
  });

  it("lists named workspaces after the personal space", () => {
    const spaces = librarySpaces([
      { id: "ws-1", name: "Atlas" },
      { id: "ws-2", name: "Field notes" },
    ]);
    assert.deepEqual(
      spaces.map((space) => space.id),
      [PERSONAL_SPACE_ID, "ws-1", "ws-2"],
    );
    assert.deepEqual(
      spaces.map((space) => space.label),
      ["Personal space", "Atlas", "Field notes"],
    );
    assert.equal(Object.hasOwn(spaces[1] ?? {}, "invite"), false);
  });

  it("drops a created row that reuses the personal id", () => {
    const spaces = librarySpaces([{ id: PERSONAL_SPACE_ID, name: "Sneaky" }]);
    assert.equal(spaces.length, 1);
    assert.equal(spaces[0]?.label, "Personal space");
  });

  it("refuses members on the personal space", () => {
    assert.throws(() => firstMember(PERSONAL_SPACE_ID, "user-1"), /cannot receive members/);
  });

  it("records the creator as the first member of a named workspace", () => {
    assert.deepEqual(firstMember("ws-1", "user-1"), {
      workspaceId: "ws-1",
      userId: "user-1",
    });
  });

  it("refuses to add a person to the personal space", () => {
    assert.throws(
      () => workspacePerson(PERSONAL_SPACE_ID, "ada@example.com", "user-2"),
      /cannot receive members/,
    );
    assert.throws(
      () => workspacePerson(PERSONAL_SPACE_ID, "ada@example.com", null),
      /cannot receive members/,
    );
  });

  it("adds an existing account as a member and keeps a missing account pending", () => {
    assert.deepEqual(workspacePerson("ws-1", "  Ada@Example.com ", "user-2"), {
      status: "member",
      workspaceId: "ws-1",
      userId: "user-2",
    });
    assert.deepEqual(workspacePerson("ws-1", "  Ada@Example.com ", null), {
      status: "pending",
      workspaceId: "ws-1",
      email: "ada@example.com",
    });
    assert.equal(
      Object.hasOwn(workspacePerson("ws-1", "ada@example.com", "user-2"), "role"),
      false,
    );
  });

  it("rejects a blank or invalid email when adding a person", () => {
    assert.throws(() => workspacePerson("ws-1", "   ", null), /Add an email address/);
    assert.throws(() => workspacePerson("ws-1", "not-an-email", "user-2"), /Invalid email/);
    assert.throws(
      () => workspacePerson("", "ada@example.com", "user-2"),
      /workspace and an account/,
    );
  });

  it("trims a workspace name and rejects a blank or oversized one", () => {
    assert.equal(workspaceName("  Atlas  "), "Atlas");
    assert.throws(() => workspaceName("   "), /Name the workspace/);
    assert.throws(() => workspaceName("a".repeat(81)), /Name is too long/);
  });

  it("keeps today's documents when the personal space is chosen beside other workspaces", () => {
    const documents = [{ id: "note-1" }, { id: "diagram-2" }];
    const created = [{ id: "ws-1", name: "Atlas" }];
    assert.equal(documentsInSpace(PERSONAL_SPACE_ID, documents, created), documents);
  });

  it("does not attach personal documents to a created workspace", () => {
    const documents = [{ id: "note-1" }];
    const created = [{ id: "ws-1", name: "Atlas" }];
    documentsInSpace("ws-1", documents, created);
    assert.deepEqual(created, [{ id: "ws-1", name: "Atlas" }]);
    assert.deepEqual(documents, [{ id: "note-1" }]);
    const space = librarySpaces(created).find((item) => item.id === "ws-1");
    assert.equal(Object.hasOwn(space ?? {}, "documents"), false);
  });

  it("opens an empty library for every created workspace the account belongs to", () => {
    const documents = [
      { id: "note-1", type: "note" },
      { id: "diagram-2", type: "diagram" },
    ];
    const created = [
      { id: "ws-1", name: "Atlas" },
      { id: "ws-2", name: "Field notes" },
    ];
    assert.deepEqual(documentsInSpace("ws-1", documents, created), []);
    assert.deepEqual(documentsInSpace("ws-2", documents, created), []);
    assert.equal(documentsInSpace(PERSONAL_SPACE_ID, documents, created), documents);
    assert.deepEqual(
      documents.map((document) => document.id),
      ["note-1", "diagram-2"],
    );
  });

  it("keeps personal documents when the id is not a membership", () => {
    const documents = [{ id: "note-1" }];
    const created = [{ id: "ws-1", name: "Atlas" }];
    assert.equal(documentsInSpace("missing", documents, created), documents);
  });

  it("remembers an open workspace the account still belongs to", () => {
    const created = [
      { id: "ws-1", name: "Atlas" },
      { id: "ws-2", name: "Field notes" },
    ];
    assert.equal(openLibraryId("ws-2", created), "ws-2");
    assert.equal(openLibraryId(PERSONAL_SPACE_ID, created), PERSONAL_SPACE_ID);
    assert.equal(openLibraryId(null, created), PERSONAL_SPACE_ID);
    assert.equal(openLibraryId("left-behind", created), PERSONAL_SPACE_ID);
    const open = openLibraryId("left-behind", created);
    assert.equal(documentsInSpace(open, [{ id: "note-1" }], created).length, 1);
  });

  it("remembers the open library and stores a personal document without a workspace", () => {
    const board = readFileSync(
      new URL("../components/library/document-board.tsx", import.meta.url),
      "utf8",
    );
    const schema = readFileSync(new URL("../db/schema.ts", import.meta.url), "utf8");
    const store = readFileSync(new URL("./documents.ts", import.meta.url), "utf8");
    const documentTable = schema.slice(
      schema.indexOf("export const documents"),
      schema.indexOf("export const documentShares"),
    );
    const create = store.slice(
      store.indexOf("export async function createDocument"),
      store.indexOf("export async function getOwnedDocument"),
    );
    assert.match(board, /pamiac-open-library/);
    assert.match(board, /openLibraryId/);
    assert.match(board, /documentsInSpace/);
    assert.match(documentTable, /workspace_id/);
    assert.equal(/workspaceId:[^,\n]*notNull/.test(documentTable), false);
    assert.match(create, /PERSONAL_SPACE_ID/);
    assert.match(create, /workspaceId: libraryId \?\? null/);
  });

  it("places a document in one workspace library and reads it back from there only", () => {
    const documents = [
      { id: "note-1", workspaceId: null },
      { id: "diagram-2", workspaceId: null },
    ];
    const created = [
      { id: "ws-1", name: "Atlas" },
      { id: "ws-2", name: "Field notes" },
    ];
    const placed = placeDocument(documents, "note-1", "ws-1");
    assert.deepEqual(
      documentsInSpace("ws-1", placed, created).map((document) => document.id),
      ["note-1"],
    );
    assert.deepEqual(
      documentsInSpace("ws-2", placed, created).map((document) => document.id),
      [],
    );
    assert.deepEqual(
      documentsInSpace(PERSONAL_SPACE_ID, placed, created).map((document) => document.id),
      ["diagram-2"],
    );
    assert.equal(documents[0]?.workspaceId, null);
  });

  it("moves a document into the latest workspace library", () => {
    const created = [
      { id: "ws-1", name: "Atlas" },
      { id: "ws-2", name: "Field notes" },
    ];
    const once = placeDocument([{ id: "note-1", workspaceId: null }], "note-1", "ws-1");
    const twice = placeDocument(once, "note-1", "ws-2");
    assert.deepEqual(documentsInSpace("ws-1", twice, created), []);
    assert.deepEqual(
      documentsInSpace("ws-2", twice, created).map((document) => document.id),
      ["note-1"],
    );
    assert.deepEqual(documentsInSpace(PERSONAL_SPACE_ID, twice, created), []);
  });

  it("refuses to place a document in the personal library or a missing document", () => {
    const documents = [{ id: "note-1", workspaceId: null }];
    assert.throws(() => placeDocument(documents, "note-1", PERSONAL_SPACE_ID), /created workspace/);
    assert.throws(() => placeDocument(documents, "note-1", ""), /created workspace/);
    assert.throws(() => placeDocument(documents, "missing", "ws-1"), /Document not found/);
    assert.equal(documents[0]?.workspaceId, null);
  });

  it("keeps a workspace document out of the personal library when the id is unknown", () => {
    const documents = [
      { id: "note-1", workspaceId: null },
      { id: "diagram-2", workspaceId: "ws-1" },
    ];
    const created = [{ id: "ws-1", name: "Atlas" }];
    assert.deepEqual(
      documentsInSpace("missing", documents, created).map((document) => document.id),
      ["note-1"],
    );
  });

  it("stores the workspace link on the owned document and lists that library", () => {
    const store = readFileSync(new URL("./documents.ts", import.meta.url), "utf8");
    const place = store.slice(
      store.indexOf("export async function placeDocumentInWorkspace"),
      store.indexOf("export async function listSpaceDocuments"),
    );
    const read = store.slice(
      store.indexOf("export async function listSpaceDocuments"),
      store.indexOf("export async function createDocument"),
    );
    const board = readFileSync(
      new URL("../components/library/document-board.tsx", import.meta.url),
      "utf8",
    );
    const drop = board.slice(board.indexOf("async function dropOn"), board.indexOf("return ("));
    assert.match(place, /set\(\{ workspaceId: libraryId \}\)/);
    assert.match(place, /documents\.ownerId/);
    assert.match(place, /memberLibraryId/);
    assert.match(read, /documentsInSpace/);
    assert.match(drop, /\[\.\.\.items\]/);
    assert.equal(drop.includes("[...library]"), false);
  });
});
