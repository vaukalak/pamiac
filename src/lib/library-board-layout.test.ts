import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function read(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("library board layout", () => {
  it("lists spaces in a left sidebar that owns workspace creation", () => {
    const board = read("../components/library/document-board.tsx");
    const sidebar = read("../components/library/library-sidebar.tsx");
    const css = read("../app/globals.css");
    const shell = css.slice(css.indexOf(".library-shell {"), css.indexOf(".library-main"));

    assert.ok(board.indexOf("<LibrarySidebar") < board.indexOf('className="library-main"'));
    assert.match(sidebar, /<WorkspaceSelector/);
    assert.match(sidebar, /<WorkspaceCreate onCreated=\{onSelect\} \/>/);
    assert.equal(/WorkspaceSelector/.test(board), false);
    assert.match(shell, /grid-template-columns:\s*minmax\(200px,\s*240px\)\s*minmax\(0,\s*1fr\)/);
    assert.match(
      css,
      /@media \(max-width:\s*760px\)\s*\{\s*\.library-shell\s*\{\s*grid-template-columns:\s*minmax\(0,\s*1fr\);/,
    );
    assert.equal(/<h1>Library<\/h1>/.test(board + sidebar), false);
  });

  it("switches Dashboard and Workspace management, with one plus beside the view toggle", () => {
    const board = read("../components/library/document-board.tsx");
    const dashboard = read("../components/library/library-dashboard.tsx");
    const manage = read("../components/library/library-manage.tsx");
    const danger = read("../components/library/library-manage-danger.tsx");
    const tools = read("../components/library/library-tools.tsx");
    const create = read("../components/library/library-create.tsx");
    const switcher = read("../components/library/library-switcher.tsx");
    const documents = read("../components/library/library-documents.tsx");
    const actions = tools.slice(tools.indexOf("library-tool-actions"), tools.indexOf("</div>"));

    assert.match(board, /useState<LibraryPanel>\("dashboard"\)/);
    assert.match(
      board,
      /workspaceId === PERSONAL_SPACE_ID \? null : \(\s*<LibrarySwitcher mode=\{panel\} onMode=\{setPanel\} \/>/,
    );
    assert.match(board, /workspaceId !== PERSONAL_SPACE_ID && panel === "manage"/);
    assert.match(switcher, />\s*Dashboard\s*</);
    assert.match(switcher, />\s*Workspace management\s*</);
    assert.equal(/PERSONAL_SPACE_ID/.test(switcher), false);
    assert.match(dashboard, /<LibraryTools[\s\S]*workspaceId=\{workspaceId\}/);
    assert.match(dashboard, /<LibraryDocuments/);
    assert.match(dashboard, /Drag cards to reorder the library/);
    assert.ok(tools.indexOf("<LibraryFilters") < tools.indexOf("library-tool-actions"));
    assert.ok(actions.indexOf("<LibraryCreate") < actions.indexOf("<ViewToggle"));
    assert.match(tools, /<LibraryCreate workspaceId=\{workspaceId\} \/>/);
    assert.match(create, /aria-label="New document"/);
    assert.match(create, /className="library-plus"/);
    assert.match(create, /New note/);
    assert.match(create, /New UML diagram/);
    assert.match(documents, /LibraryEmpty/);
    assert.match(documents, /className=\{layout === "grid" \? "doc-grid" : "doc-list"\}/);
    assert.equal(/<details/.test(manage), false);
    assert.equal(/Manage space/.test(manage), false);
    assert.equal(/WorkspaceCreate/.test(manage), false);
    assert.match(manage, /\{managing \? <WorkspaceMemberAdd/);
    assert.match(manage, /<LibraryManageDanger/);
    assert.match(danger, /<WorkspaceLeave key=\{workspaceId\} workspaceId=\{workspaceId\} \/>/);
    assert.match(
      danger,
      /\{managing \? <WorkspaceDelete key=\{workspaceId\} workspaceId=\{workspaceId\} \/> : null\}/,
    );
    assert.equal(/WorkspacePaywall|plan-grid/.test(board + manage + dashboard), false);
    assert.match(board, /view === "grid" && filter === "all" && workspaceId === PERSONAL_SPACE_ID/);
  });
});
