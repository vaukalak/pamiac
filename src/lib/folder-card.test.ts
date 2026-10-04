import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { readStylesheet } from "./stylesheet.ts";

function read(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("library folder card", () => {
  it("follows the document layout and draws one folder icon in the picture", () => {
    const card = read("../components/library/folder-card.tsx");
    const documents = read("../components/library/library-documents.tsx");
    const body = read("../components/library/folder-card-body.tsx");
    const title = read("../components/library/folder-card-title.tsx");
    const name = read("../components/library/folder-card-name.tsx");
    const picture = read("../components/library/folder-card-picture.tsx");
    const icon = read("../components/library/folder-icon.tsx");
    const css = readStylesheet();
    const folderRule = css.slice(
      css.indexOf(".library-shell .folder-card {"),
      css.indexOf(".library-shell .folder-card.dragging"),
    );

    assert.match(documents, /layout=\{layout\}/);
    assert.match(card, /layout,/);
    assert.equal(/"grid"/.test(card), false);
    assert.match(card, /onDrop=\{onDrop\}/);
    assert.match(card, /openFolder\(folder\.id\)/);
    assert.match(card, /setDrag\(\{ id: folder\.id, kind: "folder" \}\)/);
    assert.equal(/<Button/.test(body), false);
    assert.match(title, /<FolderIcon size="title" \/>/);
    assert.match(name, /<h2>/);
    assert.ok(name.indexOf("<h2>") < name.indexOf("<Button"));
    assert.equal((name.match(/<Button/g) ?? []).length, 1);
    assert.match(picture, /if \(layout === "list"\) return null/);
    assert.match(picture, /<FolderIcon size="picture" \/>/);
    assert.match(icon, /aria-label="Folder"/);
    assert.match(icon, /stroke="currentColor"/);
    assert.match(icon, /strokeWidth="1\.5"/);
    assert.match(icon, /strokeLinecap="round"/);
    assert.equal(/folder-kicker/.test(card + css), false);
    assert.equal(/min-height:\s*0/.test(folderRule), false);
    assert.match(css, /\.library-shell \.folder-picture \{[\s\S]*?min-height:\s*64px/);
  });
});
