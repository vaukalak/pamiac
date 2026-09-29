import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function read(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("library board layout", () => {
  it("puts the selector, a short Library title, and create on one header row", () => {
    const header = read("../components/library/library-header.tsx");
    const css = read("../app/globals.css");
    const row = header.slice(
      header.indexOf('<div className="workspace-head">'),
      header.indexOf("</div>"),
    );

    assert.match(row, /<WorkspaceSelector/);
    assert.ok(row.indexOf("<WorkspaceSelector") < row.indexOf("<h1>Library</h1>"));
    assert.ok(row.indexOf("<h1>Library</h1>") < row.indexOf("<LibraryCreate"));
    assert.match(header, /<LibraryCreate workspaceId=\{selectedId\} \/>/);
    assert.match(css, /\.workspace-head h1\s*\{[^}]*font-size:\s*28px/);
    assert.equal(/\.workspace-head h1\s*\{[^}]*font-size:\s*48px/.test(css), false);
    assert.equal(/\.workspace h1\s*\{[^}]*font-size:\s*48px/.test(css), false);
  });

  it("keeps filters directly above the documents and hides space admin in a closed disclosure", () => {
    const board = read("../components/library/document-board.tsx");
    const manage = read("../components/library/library-manage.tsx");
    const tools = read("../components/library/library-tools.tsx");
    const documents = read("../components/library/library-documents.tsx");
    const details = manage.slice(manage.indexOf("<details"), manage.indexOf("</details>"));

    assert.ok(board.indexOf("<LibraryTools") < board.indexOf("<LibraryDocuments"));
    assert.ok(board.indexOf("<LibraryManage") < board.indexOf("<LibraryTools"));
    assert.match(tools, /<LibraryFilters/);
    assert.match(tools, /<ViewToggle/);
    assert.match(documents, /LibraryEmpty/);
    assert.match(documents, /className=\{layout === "grid" \? "doc-grid" : "doc-list"\}/);
    assert.match(details, /<summary>Manage space<\/summary>/);
    assert.equal(/\sopen(?:=|\s|>)/.test(details), false);
    assert.match(details, /<WorkspaceCreate/);
    assert.match(manage, /\{managing \? <WorkspaceMemberAdd/);
    assert.match(manage, /<WorkspaceLeave key=\{workspaceId\} workspaceId=\{workspaceId\} \/>/);
    assert.match(manage, /\{managing \? <WorkspaceDelete/);
    assert.equal(/WorkspacePaywall|plan-grid/.test(board + manage + documents), false);
    assert.match(board, /view === "grid" && filter === "all" && workspaceId === PERSONAL_SPACE_ID/);
    assert.match(board, /Drag cards to reorder the library/);
  });
});
