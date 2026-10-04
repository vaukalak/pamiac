import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it, test } from "node:test";
import {
  noteConflictAction,
  noteSaveGate,
  remoteNoteMarkdown,
  remoteNoteTitle,
} from "./note-sync.ts";

test("a clean note takes the remote markdown when the version is newer", () => {
  const next = remoteNoteMarkdown({
    dirty: false,
    saveInFlight: false,
    localMarkdown: "local",
    remoteMarkdown: "# remote",
    remoteVersion: 4,
    appliedVersion: 3,
  });
  assert.equal(next.replace, true);
  assert.equal(next.markdown, "# remote");
  assert.equal(next.version, 4);
});

test("a dirty note keeps its draft so the next save can overwrite the note", () => {
  const next = remoteNoteMarkdown({
    dirty: true,
    saveInFlight: false,
    localMarkdown: "draft",
    remoteMarkdown: "# remote",
    remoteVersion: 4,
    appliedVersion: 3,
  });
  assert.equal(next.replace, false);
  assert.equal(next.markdown, "draft");
  assert.equal(next.version, 3);
});

test("a poll older than the applied version is ignored", () => {
  const next = remoteNoteMarkdown({
    dirty: false,
    saveInFlight: false,
    localMarkdown: "current",
    remoteMarkdown: "stale",
    remoteVersion: 2,
    appliedVersion: 5,
  });
  assert.equal(next.replace, false);
  assert.equal(next.markdown, "current");
  assert.equal(next.version, 5);
});

test("a poll is not applied while a note save is in flight", () => {
  const next = remoteNoteMarkdown({
    dirty: false,
    saveInFlight: true,
    localMarkdown: "saving",
    remoteMarkdown: "# remote",
    remoteVersion: 6,
    appliedVersion: 5,
  });
  assert.equal(next.replace, false);
  assert.equal(next.markdown, "saving");
});

test("a clean note title follows the server and a dirty title stays", () => {
  assert.equal(
    remoteNoteTitle({
      titleDirty: false,
      saveInFlight: false,
      localTitle: "Old",
      remoteTitle: "New",
      remoteVersion: 2,
      appliedVersion: 1,
    }),
    "New",
  );
  assert.equal(
    remoteNoteTitle({
      titleDirty: true,
      saveInFlight: false,
      localTitle: "Draft",
      remoteTitle: "New",
      remoteVersion: 2,
      appliedVersion: 1,
    }),
    "Draft",
  );
});

test("a note with no draft stays clean while an upload or save is blocking", () => {
  assert.equal(
    noteSaveGate({
      dirty: false,
      titleDirty: false,
      canEdit: true,
      uploadHeld: true,
      saveInFlight: true,
    }),
    "clean",
  );
  assert.equal(
    noteSaveGate({
      dirty: false,
      titleDirty: false,
      canEdit: false,
      uploadHeld: false,
      saveInFlight: false,
    }),
    "clean",
  );
});

test("a dirty editable note waits to save when nothing else is blocking", () => {
  assert.equal(
    noteSaveGate({
      dirty: true,
      titleDirty: false,
      canEdit: true,
      uploadHeld: false,
      saveInFlight: false,
    }),
    "debounce",
  );
  assert.equal(
    noteSaveGate({
      dirty: false,
      titleDirty: true,
      canEdit: true,
      uploadHeld: false,
      saveInFlight: false,
    }),
    "debounce",
  );
});

test("an upload hold pauses a body or title save so the image request can finish", () => {
  assert.equal(
    noteSaveGate({
      dirty: true,
      titleDirty: false,
      canEdit: true,
      uploadHeld: true,
      saveInFlight: false,
    }),
    "pause",
  );
  assert.equal(
    noteSaveGate({
      dirty: false,
      titleDirty: true,
      canEdit: true,
      uploadHeld: true,
      saveInFlight: false,
    }),
    "pause",
  );
});

test("a save already in flight pauses another note save", () => {
  assert.equal(
    noteSaveGate({
      dirty: true,
      titleDirty: true,
      canEdit: true,
      uploadHeld: false,
      saveInFlight: true,
    }),
    "pause",
  );
});

test("a note that cannot be edited does not start a save", () => {
  assert.equal(
    noteSaveGate({
      dirty: true,
      titleDirty: true,
      canEdit: false,
      uploadHeld: false,
      saveInFlight: false,
    }),
    "pause",
  );
});

test("a clean conflict settles even while an upload is held", () => {
  assert.equal(noteConflictAction({ uploadHeld: true, dirty: false, titleDirty: false }), "settle");
  assert.equal(
    noteConflictAction({ uploadHeld: false, dirty: false, titleDirty: false }),
    "settle",
  );
});

test("a dirty note or title defers a conflict until the upload hold releases", () => {
  assert.equal(noteConflictAction({ uploadHeld: true, dirty: true, titleDirty: false }), "defer");
  assert.equal(noteConflictAction({ uploadHeld: true, dirty: false, titleDirty: true }), "defer");
});

test("a dirty note or title publishes a conflict when no upload is held", () => {
  assert.equal(
    noteConflictAction({ uploadHeld: false, dirty: true, titleDirty: false }),
    "publish",
  );
  assert.equal(
    noteConflictAction({ uploadHeld: false, dirty: false, titleDirty: true }),
    "publish",
  );
});

describe("upload save hold wiring", () => {
  function read(path: string) {
    return readFileSync(new URL(path, import.meta.url), "utf8");
  }

  it("holds saves before the image request and releases them if the upload fails", () => {
    const editor = read("../components/note-editor.tsx");
    const uploadAt = editor.indexOf("uploadFile: editable");
    const holdAt = editor.indexOf("holdSavesRef.current()", uploadAt);
    const requestAt = editor.indexOf("uploadImageRef.current(file)", holdAt);
    const releaseAt = editor.indexOf("releaseSavesRef.current()", requestAt);
    assert.ok(uploadAt >= 0 && holdAt > uploadAt && requestAt > holdAt && releaseAt > requestAt);
    assert.match(
      editor.slice(uploadAt, releaseAt + 40),
      /uploadImageRef\.current\(file\)\.finally\(/,
    );
    assert.match(editor.slice(releaseAt), /: undefined/);
    assert.match(editor, /holdSavesRef\.current = onHoldSaves/);
    assert.match(editor, /releaseSavesRef\.current = onReleaseSaves/);
  });

  it("does not start a second save while one is in flight or an upload is held", () => {
    const note = read("../components/document/note-document.tsx");
    const hold = note.slice(
      note.indexOf("function holdSaves()"),
      note.indexOf("function releaseSaves()"),
    );
    const release = note.slice(
      note.indexOf("function releaseSaves()"),
      note.indexOf("function commitTitle("),
    );
    assert.match(note, /if \(saveInFlight\.current \|\| uploadHolds\.current > 0\) return;/);
    assert.match(note, /if \(gate !== "debounce"\) return;/);
    assert.match(hold, /uploadHolds\.current \+= 1/);
    assert.match(hold, /window\.clearTimeout\(timer\.current\)/);
    assert.match(hold, /timer\.current = null/);
    assert.match(release, /uploadHolds\.current = Math\.max\(0, uploadHolds\.current - 1\)/);
    assert.match(release, /if \(uploadHolds\.current > 0\) return;/);
    assert.match(release, /if \(!dirty\.current && !titleDirty\.current\) return;\s*schedule\(\)/);
    assert.match(note, /onHoldSaves=\{holdSaves\}/);
    assert.match(note, /onReleaseSaves=\{releaseSaves\}/);
  });

  it("defers a conflict retry until the upload hold releases and skips remote replacement", () => {
    const note = read("../components/document/note-document.tsx");
    const actionAt = note.indexOf("const action = noteConflictAction(");
    const settleAt = note.indexOf('if (action === "settle")', actionAt);
    const publishAt = note.indexOf('if (action === "publish") publish(payload);', settleAt);
    assert.ok(actionAt >= 0 && settleAt > actionAt && publishAt > settleAt);
    assert.equal(note.slice(actionAt, publishAt).includes("publish("), false);
    assert.match(note, /conflictRetries\.current = 0;\s*publish\(payload\)/);
    assert.match(
      note,
      /if \(saveInFlight\.current \|\| save\.isPending \|\| uploadHolds\.current > 0\) return;/,
    );
    assert.match(note, /uploadHolds\.current > 0 \|\|/);
  });
});
