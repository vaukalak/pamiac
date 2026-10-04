import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, describe, it, mock } from "node:test";
import { DocumentSaveConflict, saveOwnerDocument } from "../components/document/document-client.ts";

describe("saveOwnerDocument conflict", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("returns the arrived note so the editor can retry with that version", async () => {
    mock.method(globalThis, "fetch", async () =>
      Response.json(
        {
          error: "Document changed. Read it again and send the current version.",
          version: 4,
          title: "Note",
          content: "remote",
        },
        { status: 409 },
      ),
    );

    await assert.rejects(
      () => saveOwnerDocument("doc", { content: "local", version: 3 }),
      (error: unknown) => {
        assert.ok(error instanceof DocumentSaveConflict);
        assert.equal(error.version, 4);
        assert.equal(error.title, "Note");
        assert.equal(error.content, "remote");
        return true;
      },
    );
  });

  it("returns an arrived diagram object without turning it into a string", async () => {
    const content = { nodes: [{ id: "user" }], relations: [] };
    mock.method(globalThis, "fetch", async () =>
      Response.json(
        {
          error: "Document changed. Read it again and send the current version.",
          version: 8,
          title: "Map",
          content,
        },
        { status: 409 },
      ),
    );

    await assert.rejects(
      () => saveOwnerDocument("doc", { patch: { nodes: [] }, version: 7 }),
      (error: unknown) => {
        assert.ok(error instanceof DocumentSaveConflict);
        assert.equal(error.version, 8);
        assert.equal(error.title, "Map");
        assert.deepEqual(error.content, content);
        return true;
      },
    );
  });

  it("still fails the save when the response is not a conflict", async () => {
    mock.method(globalThis, "fetch", async () => Response.json({ error: "No" }, { status: 500 }));

    await assert.rejects(
      () => saveOwnerDocument("doc", { title: "Next", version: 1 }),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.equal(error instanceof DocumentSaveConflict, false);
        return true;
      },
    );
  });

  it("returns the saved document on success", async () => {
    mock.method(globalThis, "fetch", async () =>
      Response.json({ version: 2, title: "Note", content: "saved" }),
    );

    assert.deepEqual(await saveOwnerDocument("doc", { content: "saved", version: 1 }), {
      version: 2,
      title: "Note",
      content: "saved",
    });
  });
});

describe("editor conflict retry", () => {
  it("keeps a dirty note, takes a clean title, and stores the saved version", () => {
    const note = readFileSync(
      new URL("../components/document/note-document.tsx", import.meta.url),
      "utf8",
    );
    assert.match(note, /version: appliedVersion\.current/);
    assert.equal(/version:\s*versionQuery/.test(note), false);
    assert.match(note, /conflictRetries\.current >= 3/);
    assert.match(note, /if \(!dirty\.current\)/);
    assert.match(
      note,
      /const readableContent = rewriteStoredR2Images\(error\.content\);\s*latest\.current\.content = readableContent;\s*setRemote\(\{ markdown: readableContent, version: error\.version \}\)/,
    );
    assert.match(note, /if \(!titleDirty\.current\)/);
    assert.match(note, /payload\.content = latest\.current\.content/);
    assert.match(note, /payload\.title = latest\.current\.title/);
    assert.match(note, /setQueryData\(documentVersionKey\(id\), \{ version: result\.version \}\)/);
  });

  it("merges a diagram conflict through the remote path and retries the pending patch", () => {
    const sync = readFileSync(
      new URL("../components/diagram/use-diagram-sync.ts", import.meta.url),
      "utf8",
    );
    assert.match(sync, /version: appliedVersion\.current/);
    assert.equal(/version:\s*versionQuery/.test(sync), false);
    assert.match(
      sync,
      /mergeRemoteDiagram\(diagramRef\.current\(\), remote, dirtyState\(dirty\)\)/,
    );
    assert.match(sync, /adoptRemote\(error\.content, error\.version, error\.title\)/);
    assert.match(sync, /publish\(buildDiagramPatch\(diagramRef\.current\(\), dirty\)\)/);
    assert.match(sync, /conflictRetries\.current >= 3/);
    assert.match(sync, /setQueryData\(documentVersionKey\(id\), \{ version: result\.version \}\)/);
  });

  it("retries a diagram title without sending the diagram body", () => {
    const title = readFileSync(
      new URL("../components/document/diagram-title.tsx", import.meta.url),
      "utf8",
    );
    assert.match(title, /version: appliedVersion\.current/);
    assert.equal(title.includes("versionQuery"), false);
    assert.match(title, /mutationFn: \(body: \{ title: string; version: number \}\)/);
    assert.match(title, /conflictRetries\.current >= 3/);
    assert.match(title, /publish\(next\)/);
    assert.equal(title.includes("content:"), false);
    assert.match(title, /setQueryData\(documentVersionKey\(id\), \{ version: result\.version \}\)/);
  });
});
