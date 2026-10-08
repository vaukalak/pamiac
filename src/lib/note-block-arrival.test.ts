import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { readStylesheet } from "./stylesheet.ts";
import {
  blockLinkArrivalFadeMs,
  blockLinkArrivalHoldMs,
  blockLinkMissingMessage,
  blockLinkScrollDelta,
  blockLinkStrongBackground,
  blockLinkSubtleBackground,
  blockLinkTargetClass,
  resolveBlockLink,
  stickyHeaderInset,
} from "./note-block-arrival.ts";

function read(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("block link resolution", () => {
  const blocks = [{ id: "parent", children: [{ id: "child name" }] }];

  it("ignores an empty hash and resolves a nested checklist item id", () => {
    assert.deepEqual(resolveBlockLink("", blocks), { kind: "absent" });
    assert.deepEqual(resolveBlockLink("#", blocks), { kind: "absent" });
    assert.deepEqual(resolveBlockLink("#child%20name", blocks), {
      kind: "block",
      id: "child name",
    });
    assert.deepEqual(resolveBlockLink("#parent", blocks), { kind: "block", id: "parent" });
  });

  it("reports a deleted or unknown target instead of another block", () => {
    assert.deepEqual(resolveBlockLink("#missing", blocks), { kind: "missing" });
    assert.deepEqual(resolveBlockLink("#%", blocks), { kind: "missing" });
    assert.equal(blockLinkMissingMessage, "The linked block is no longer available.");
  });
});

describe("block link scroll", () => {
  const pane = { viewportHeight: 900, stickyTop: 56, stickyBottom: 0 };

  it("places an off-screen block one third down the visible area", () => {
    const delta = blockLinkScrollDelta({ ...pane, blockTop: 1200, blockHeight: 32 });

    assert.equal(delta, 1200 - (56 + (900 - 56) / 3));
  });

  it("moves a block that is under the sticky header", () => {
    const delta = blockLinkScrollDelta({ ...pane, blockTop: 20, blockHeight: 30 });

    assert.equal(delta, 20 - (56 + (900 - 56) / 3));
    assert.ok(delta !== null && delta < 0);
  });

  it("leaves a block that is already in the upper-middle of the pane", () => {
    const span = 900 - 56;
    const blockTop = 56 + span * 0.3;

    assert.equal(blockLinkScrollDelta({ ...pane, blockTop, blockHeight: 40 }), null);
  });

  it("scrolls a fully visible block that sits at the bottom of a long note", () => {
    const delta = blockLinkScrollDelta({ ...pane, blockTop: 800, blockHeight: 40 });

    assert.equal(delta, 800 - (56 + (900 - 56) / 3));
  });

  it("skips a nudge smaller than four pixels and an empty pane", () => {
    const desired = 56 + (900 - 56) / 3;

    assert.equal(blockLinkScrollDelta({ ...pane, blockTop: desired + 3, blockHeight: 800 }), null);
    assert.equal(
      blockLinkScrollDelta({
        blockTop: 10,
        blockHeight: 20,
        viewportHeight: 40,
        stickyTop: 40,
        stickyBottom: 0,
      }),
      null,
    );
  });

  it("counts only a full-width bar pinned to the top as a sticky header", () => {
    assert.equal(stickyHeaderInset(null, 400), 0);
    assert.equal(stickyHeaderInset({ top: 0, bottom: 56, width: 390 }, 400), 56);
    assert.equal(stickyHeaderInset({ top: 16, bottom: 56, width: 40 }, 1200), 0);
    assert.equal(stickyHeaderInset({ top: 0, bottom: 56, width: 80 }, 400), 0);
    assert.equal(stickyHeaderInset({ top: 0, bottom: 0, width: 400 }, 400), 0);
    assert.equal(stickyHeaderInset({ top: 0, bottom: 56, width: 400 }, 0), 0);
  });
});

describe("block link arrival wiring", () => {
  const link = read("../components/note/note-block-link.tsx");
  const editor = read("../components/note-editor.tsx");
  const css = readStylesheet();

  it("highlights the block content row, including a checklist checkbox, and not nested blocks", () => {
    assert.match(link, /:scope > \.bn-block-content/);
    assert.match(link, /blockLinkTargetClass/);
    assert.equal(blockLinkTargetClass, "note-block-link-target");
    assert.doesNotMatch(
      link,
      /preventDefault|stopPropagation|setTextCursorPosition|editor\.focus\(/,
    );
    assert.doesNotMatch(link, /updateBlock|replaceBlocks|onChange\(/);
  });

  it("replays arrival for a new hash and keeps the marker until a click in the editor", () => {
    assert.match(link, /hashchange/);
    assert.match(link, /popstate/);
    assert.match(link, /setDismissedHash\(null\)/);
    assert.match(link, /setDismissedHash\(window\.location\.hash\)/);
    assert.match(link, /closest\("\.bn-editor"\)/);
    assert.match(link, /blockLinkArrivalHoldMs/);
    assert.equal(blockLinkArrivalHoldMs, 2500);
    assert.equal(blockLinkArrivalFadeMs, 400);
    assert.match(css, /transition: background-color 400ms ease;/);
  });

  it("scrolls immediately without the arrival animation when reduced motion is on", () => {
    assert.match(link, /prefers-reduced-motion: reduce/);
    assert.match(link, /reduced \? "auto" : "smooth"/);
    assert.match(link, /paintMode\.current = reduced \? "still" : "arrive"/);
    assert.match(link, /<Paragraph className="note-block-link-notice">/);
    const reducedAt = css.indexOf("@media (prefers-reduced-motion: reduce)");
    const settleAt = css.indexOf("note-block-link-settle", reducedAt);
    const transitionAt = css.indexOf("transition: none;", settleAt);

    assert.ok(reducedAt >= 0 && settleAt > reducedAt && transitionAt > settleAt);
  });

  it("uses the lime marker and the subtle green wash without changing text layout", () => {
    const rule = css.slice(css.indexOf(".note-block-link-target"));
    const block = rule.slice(0, rule.indexOf("note-block-link-arriving"));

    assert.match(block, /border-radius: 8px;/);
    assert.match(block, /box-shadow: inset 3px 0 0 var\(--home-lime\);/);
    assert.match(block, /rgba\(180, 230, 40, 0\.1\)/);
    assert.match(css, /rgba\(180, 230, 40, 0\.28\)/);
    assert.match(link, /blockLinkMissingMessage/);
    assert.doesNotMatch(block, /text-decoration|padding|font-size/);
  });

  it("runs for read-only notes from the same editor and does not publish the marker", () => {
    assert.match(editor, /<NoteBlockLink blocks=\{editor\.document\} ready=\{contentReady\} \/>/);
    assert.doesNotMatch(link, /editable/);
    assert.doesNotMatch(editor, /scrollIntoView\(\{ block: "center" \}\)/);
    assert.equal(blockLinkSubtleBackground, "rgba(180, 230, 40, 0.1)");
    assert.equal(blockLinkStrongBackground, "rgba(180, 230, 40, 0.28)");
  });
});
