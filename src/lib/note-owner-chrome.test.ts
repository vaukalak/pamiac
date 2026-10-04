import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { readStylesheet } from "./stylesheet.ts";

function read(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

function block(source: string, header: string) {
  const at = source.indexOf(header);
  assert.ok(at >= 0, header);
  const open = source.indexOf("{", at);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    const character = source[index];
    if (character === "{") depth += 1;
    else if (character === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(at, index + 1);
    }
  }
  assert.fail(`unclosed ${header}`);
}

describe("library note inset", () => {
  it("keeps a tighter library gutter than the editor default and leaves the paper sheet", () => {
    const css = readStylesheet();
    const paper = block(css, "\n.note-sheet {");
    const sheet = block(css, ".library-shell .note-sheet {");
    const editor = block(css, ".library-shell .note-editor .bn-editor {");

    assert.match(paper, /padding:\s*36px 0 48px/);
    assert.match(sheet, /padding:\s*22px 14px 48px/);
    assert.match(editor, /padding-inline:\s*36px 8px/);
    assert.doesNotMatch(css, /padding-inline:\s*54px/);
    assert.doesNotMatch(paper, /padding-inline:\s*0/);
  });
});

describe("owner delete control", () => {
  it("uses a danger icon button and keeps confirm, the mutation, and the error", () => {
    const actions = read("../components/document/document-owner-actions.tsx");
    const screen = read("../components/document-screen.tsx");

    assert.match(actions, /className="danger icon-button"/);
    assert.match(actions, /<Button/);
    assert.equal(/<button/.test(actions), false);
    assert.match(
      actions,
      /className="visually-hidden">\{remove\.isPending \? "Deleting…" : "Delete"\}/,
    );
    assert.match(actions, /aria-hidden="true"/);
    assert.match(actions, /disabled=\{remove\.isPending\}/);
    assert.match(actions, /window\.confirm\("Delete this document\?"\)/);
    assert.match(actions, /method: "DELETE"/);
    assert.match(actions, /\{message \? <Alert>\{message\}<\/Alert> : null\}/);
    assert.match(
      screen,
      /<DocumentOwnerActions id=\{id\} onShare=\{\(\) => setSharing\(true\)\} \/>/,
    );
  });
});

describe("markdown actions stay on the note share dialog", () => {
  it("leaves public export in the heading and keeps workspace-add free of the note slot", () => {
    const publicTools = read("../components/public-note/public-note-tools.tsx");
    const menu = read("../components/library/document-menu.tsx");
    const share = read("../components/note/note-share-markdown.tsx");
    const note = read("../components/document/note-document.tsx");

    assert.match(publicTools, /<NoteExport readMarkdown=\{\(\) => markdown\} title=\{title\} \/>/);
    assert.equal(publicTools.includes("NoteShareMarkdown"), false);
    assert.equal(publicTools.includes("ShareModal"), false);
    assert.match(menu, /lockWorkspace/);
    assert.equal(menu.includes("markdownSlot"), false);
    assert.equal(share.includes("navigator.clipboard"), false);
    assert.equal(share.includes("createObjectURL"), false);
    assert.match(note, /\{sharing \? \(/);
    assert.match(note, /title=\{name\.trim\(\) \|\| title\}/);
  });
});
