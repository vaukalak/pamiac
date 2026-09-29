import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { documentsInSpace, librarySpaces, PERSONAL_SPACE_ID } from "./library-spaces.ts";

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
    assert.equal(/invite/i.test(selector), false);
    assert.equal(/invite/i.test(board), false);
  });
});
