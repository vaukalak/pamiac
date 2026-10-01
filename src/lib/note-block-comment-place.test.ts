import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  commentBlockMatchIndex,
  noteCommentBlockClearance,
  noteCommentFallbackHeight,
  noteCommentGap,
  placeNoteBlockComment,
  type CommentBlockMatch,
} from "./note-block-comment-place.ts";

function read(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

function match(patch: Partial<CommentBlockMatch> = {}): CommentBlockMatch {
  return {
    blockIdHit: true,
    inBnEditor: true,
    isOuter: true,
    outerInBnEditor: true,
    ...patch,
  };
}

describe("note block comment placement", () => {
  it("aligns the card to the block's left edge, width, and an 8px gap", () => {
    assert.deepEqual(placeNoteBlockComment({ bottom: 180, left: 264, width: 640 }, 96), {
      left: 264,
      marginBottom: 96 + noteCommentBlockClearance,
      top: 180 + noteCommentGap,
      width: 640,
    });
  });

  it("uses the viewport bottom and does not add a scroll offset", () => {
    const placed = placeNoteBlockComment({ bottom: 40, left: 280, width: 520 }, 64);

    assert.equal(placed.top, 48);
    assert.equal(placed.left, 280);
  });

  it("reserves the fallback card height when the card has not been measured", () => {
    const placed = placeNoteBlockComment({ bottom: 20, left: 10, width: 100 }, 0);

    assert.equal(placed.marginBottom, noteCommentFallbackHeight + noteCommentBlockClearance);
    assert.equal(placed.top, 20 + noteCommentGap);
  });

  it("ignores a hit outside .bn-editor and a hit that is not a block", () => {
    const index = commentBlockMatchIndex([
      match({ inBnEditor: false, outerInBnEditor: false }),
      match({ isOuter: false, outerInBnEditor: false }),
      match({ isOuter: false }),
    ]);

    assert.equal(index, 2);
  });

  it("returns null when every candidate is outside the editor", () => {
    assert.equal(
      commentBlockMatchIndex([
        match({ blockIdHit: false }),
        match({ inBnEditor: false, isOuter: false, outerInBnEditor: false }),
      ]),
      null,
    );
  });

  it("keeps the composer on the block viewport box until the block exists", () => {
    const comment = read("../components/note/note-block-comment.tsx");
    const place = read("./note-block-comment-place.ts");
    const css = read("../app/globals.css");
    const card = css.slice(
      css.indexOf(".note-block-comment {"),
      css.indexOf(".note-block-comment-card {"),
    );

    assert.match(place, /\[data-id="\$\{escaped\}"\], \[id="\$\{escaped\}"\]/);
    assert.match(place, /closest\("\.bn-editor"\)/);
    assert.match(comment, /findNoteCommentBlock\(root, blockId\)/);
    assert.match(comment, /placeNoteBlockComment/);
    assert.match(comment, /document\.addEventListener\("scroll", place, true\)/);
    assert.match(comment, /window\.addEventListener\("resize", place\)/);
    assert.match(comment, /classList\.add\("is-placed"\)/);
    assert.match(comment, /classList\.remove\("is-placed"\)/);
    assert.doesNotMatch(comment, /scrollTop/);
    assert.doesNotMatch(comment, /getElementById/);
    assert.match(card, /position:\s*fixed/);
    assert.match(card, /visibility:\s*hidden/);
    assert.match(card, /\.note-block-comment\.is-placed\s*\{[^}]*visibility:\s*visible/);
    assert.doesNotMatch(card, /top:\s*0/);
    assert.doesNotMatch(card, /left:\s*0/);
  });
});
