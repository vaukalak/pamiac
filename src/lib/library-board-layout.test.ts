import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { readStylesheet } from "./stylesheet.ts";

function read(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("library board layout", () => {
  it("lists spaces in a left sidebar that owns workspace creation", () => {
    const board = read("../components/library/document-board.tsx");
    const sidebar = read("../components/library/library-sidebar-panel.tsx");
    const page = read("../app/workspace/page.tsx");
    const css = readStylesheet();
    const shell = css.slice(css.indexOf(".library-shell {"), css.indexOf(".library-main"));

    assert.ok(board.indexOf("<LibrarySidebar") < board.indexOf('className="library-main"'));
    assert.match(sidebar, /<WorkspaceSelector/);
    assert.match(sidebar, /<WorkspaceCreate onCreated=\{onSelect\} \/>/);
    assert.equal(/WorkspaceSelector/.test(board), false);
    assert.match(shell, /grid-template-columns:\s*240px\s*minmax\(0,\s*1fr\)/);
    assert.match(
      css,
      /@media \(max-width:\s*760px\)\s*\{\s*\.library-shell\s*\{\s*grid-template-columns:\s*minmax\(0,\s*1fr\);/,
    );
    assert.equal(/<h1>Library<\/h1>/.test(board + sidebar), false);
    assert.match(page, /email=\{result\.session\.user\.email\}/);
    assert.equal(/className="workspace"/.test(page), false);
    assert.equal(/Shared with me|All changes synced/.test(board + sidebar), false);
  });

  it("keeps the document dashboard, with create beside connect and search beside the view", () => {
    const board = read("../components/library/document-board.tsx");
    const dashboard = read("../components/library/library-dashboard.tsx");
    const danger = read("../components/workspace-settings/workspace-settings-danger.tsx");
    const invite = read("../components/workspace-members/workspace-members-invite.tsx");
    const links = read("../components/library/library-workspace-links.tsx");
    const tools = read("../components/library/library-tools.tsx");
    const search = read("../components/library/library-search.tsx");
    const filters = read("../components/library/library-filters.tsx");
    const heading = read("../components/library/library-heading-copy.tsx");
    const actions = read("../components/library/library-heading-actions.tsx");
    const connect = read("../components/library/library-connect-link.tsx");
    const create = read("../components/library/library-create.tsx");
    const documents = read("../components/library/library-documents.tsx");
    const column = read("../components/library/library-column.tsx");

    assert.equal(/LibraryPanel|LibrarySwitcher|LibraryManage/.test(board + column), false);
    assert.match(column, /<LibraryDashboard/);
    assert.match(links, /Workspace settings/);
    assert.match(links, /href="\/workspace\/members"/);
    assert.match(invite, /Invite member/);
    assert.match(invite, /<WorkspaceMemberAdd/);
    assert.match(danger, /<WorkspaceSettingsLeave \/>/);
    assert.match(danger, /\{managing \? <WorkspaceSettingsDelete \/> : null\}/);
    assert.match(dashboard, /<LibraryHeading[\s\S]*workspaceId=\{workspaceId\}/);
    assert.match(dashboard, /<LibraryDocuments/);
    assert.ok(dashboard.indexOf("<LibraryFilters") < dashboard.indexOf("<LibraryTools"));
    assert.match(dashboard, /Drag cards to reorder the library/);
    assert.ok(tools.indexOf("<LibrarySearch") < tools.indexOf("<ViewToggle"));
    assert.match(search, /<Form\.Input/);
    assert.equal(/<input/.test(search), false);
    assert.equal(/useState/.test(search), false);
    assert.match(filters, /count=\{counts\[value\]\}/);
    assert.match(heading, /eyebrow="Your knowledge, connected"/);
    assert.match(heading, /subtitle="A shared memory for you and your agents\."/);
    assert.match(heading, /<PageTitle/);
    assert.match(actions, /<LibraryCreate workspaceId=\{workspaceId\} \/>/);
    assert.match(connect, /href="\/workspace\/tokens"/);
    assert.match(connect, /Connect agent/);
    assert.match(create, /aria-label="New document"/);
    assert.match(create, /className="library-plus"/);
    assert.match(create, />\s*Create\s*</);
    assert.match(create, /New note/);
    assert.match(create, /New UML diagram/);
    assert.match(documents, /LibraryEmpty/);
    assert.match(documents, /className=\{layout === "grid" \? "doc-grid" : "doc-list"\}/);
    assert.equal(/WorkspaceCreate/.test(danger + invite), false);
    assert.equal(/WorkspacePaywall|plan-grid/.test(board + column + danger + dashboard), false);
    assert.match(
      board,
      /view === "grid" && filter === "all" && workspaceId === PERSONAL_SPACE_ID && query\.trim\(\) === ""/,
    );
  });
});
