import assert from "node:assert/strict";
import test from "node:test";
import { remoteNoteMarkdown, remoteNoteTitle } from "./note-sync.ts";

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
