import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { flattenWikiBlock, linkifyWikiBlocks, resolveNoteTitle } from "./note-link.ts";

const notes = [
  { id: "personal", title: "Roadmap", type: "note" as const, workspaceId: null },
  { id: "team", title: " roadmap ", type: "note" as const, workspaceId: "ws-1" },
  { id: "diagram", title: "Roadmap", type: "diagram" as const, workspaceId: "ws-1" },
  { id: "other", title: "Budget", type: "note" as const, workspaceId: "ws-2" },
];

describe("links between notes", () => {
  it("opens the note in the same workspace before a same-titled note elsewhere", () => {
    assert.equal(resolveNoteTitle("Roadmap", notes, "ws-1"), "team");
    assert.equal(resolveNoteTitle("  roadmap ", notes, null), "personal");
    assert.equal(resolveNoteTitle("Budget", notes, "ws-1"), "other");
    assert.equal(resolveNoteTitle("Missing", notes, "ws-1"), null);
    assert.equal(resolveNoteTitle("   ", notes, "ws-1"), null);
  });

  it("keeps [[title]] in markdown and turns it into a note link in the editor", () => {
    const blocks = [
      {
        id: "p",
        type: "paragraph",
        props: {},
        content: [{ type: "text", text: "See [[Roadmap]] today", styles: {} }],
        children: [],
      },
      {
        id: "code",
        type: "codeBlock",
        props: {},
        content: [{ type: "text", text: "[[Roadmap]]", styles: {} }],
        children: [],
      },
    ];
    const linked = linkifyWikiBlocks(blocks);
    const paragraph = linked[0]?.content as {
      type: string;
      props?: { title: string };
      text?: string;
    }[];

    assert.equal(paragraph[0]?.text, "See ");
    assert.equal(paragraph[1]?.type, "noteLink");
    assert.equal(paragraph[1]?.props?.title, "Roadmap");
    assert.equal(paragraph[2]?.text, " today");
    assert.deepEqual(linked[1]?.content, blocks[1]?.content);

    const flat = flattenWikiBlock(linked[0]);
    const text = (flat.content as { text?: string }[]).map((item) => item.text ?? "").join("");
    assert.equal(text, "See [[Roadmap]] today");
    assert.deepEqual(linkifyWikiBlocks(linked), linked);
  });
});
