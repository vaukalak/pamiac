import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { libraryQueryMatches, libraryTypeCounts } from "./library-query.ts";

describe("library search and counts", () => {
  it("matches a title or a preview and ignores the surrounding case", () => {
    assert.equal(libraryQueryMatches("Agent workflow", "Empty note", "agent"), true);
    assert.equal(libraryQueryMatches("Roadmap", "Planner · Research agent", "research"), true);
    assert.equal(libraryQueryMatches("Roadmap", "Planner · Research agent", "  PLANNER  "), true);
    assert.equal(libraryQueryMatches("Roadmap", "Planner", "invoice"), false);
  });

  it("treats a blank query as the whole open library", () => {
    assert.equal(libraryQueryMatches("Roadmap", "Planner", ""), true);
    assert.equal(libraryQueryMatches("Roadmap", "Planner", "   "), true);
  });

  it("counts notes and diagrams in the open space", () => {
    const counts = libraryTypeCounts([
      { type: "note" },
      { type: "diagram" },
      { type: "note" },
      { type: "other" },
    ]);

    assert.deepEqual(counts, { all: 4, note: 2, diagram: 1 });
  });
});
