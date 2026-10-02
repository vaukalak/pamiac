import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { isRawNoteView } from "./note-raw.ts";

function read(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("raw note view", () => {
  it("matches only the raw query value", () => {
    assert.equal(isRawNoteView("raw"), true);
    assert.equal(isRawNoteView(["raw"]), true);
    assert.equal(isRawNoteView(["raw", "other"]), true);
    assert.equal(isRawNoteView("Raw"), false);
    assert.equal(isRawNoteView("markdown"), false);
    assert.equal(isRawNoteView(undefined), false);
    assert.equal(isRawNoteView([]), false);
  });

  it("renders note markdown without the document shell and leaves every other view in the shell", () => {
    const page = read("../app/d/[id]/page.tsx");
    const raw = read("../components/document/note-raw-view.tsx");
    const css = read("../app/globals.css");
    const gate = page.slice(
      page.indexOf("isRawNoteView(query.view)"),
      page.indexOf("const spaceName"),
    );

    assert.match(page, /searchParams: Promise<\{ view\?: string \| string\[\] \}>/);
    assert.match(gate, /documentType === "note"/);
    assert.match(gate, /access\.level === "view" \|\| access\.level === "edit"/);
    assert.match(
      gate,
      /<NoteRawView markdown=\{noteExportMarkdown\(bundle\.document\.content\)\} \/>/,
    );
    assert.equal(gate.includes("DocumentShell"), false);
    assert.match(page, /<DocumentShell/);
    assert.match(raw, /<pre className="note-raw">\{markdown\}<\/pre>/);
    assert.equal(/DocumentShell|Button|BlockNote/.test(raw), false);
    assert.match(css, /body:has\(\.note-raw\)/);
    assert.match(css, /\.note-raw \{[^}]*white-space:\s*pre-wrap/);
  });
});

describe("copy markdown", () => {
  it("places Copy Markdown beside Export Markdown and copies the same export text", () => {
    const note = read("../components/document/note-document.tsx");
    const copy = read("../components/note/note-copy-markdown.tsx");
    const download = read("../components/note/note-export.tsx");

    assert.ok(note.indexOf("<NoteCopyMarkdown") < note.indexOf("<NoteExport"));
    assert.match(note, /readMarkdown=\{\(\) => latest\.current\.content\}/);
    assert.match(copy, /Copy Markdown/);
    assert.match(download, /Export Markdown/);
    assert.match(copy, /noteExportMarkdown\(readMarkdown\(\)\)/);
    assert.match(copy, /navigator\.clipboard\.writeText/);
    assert.match(copy, /<Button/);
    assert.equal(/<button/.test(copy), false);
  });
});
