import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  documentsInSpace,
  firstMember,
  librarySpaces,
  PERSONAL_SPACE_ID,
  workspaceName,
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
});
