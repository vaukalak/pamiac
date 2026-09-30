import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  libraryFilter,
  libraryPanel,
  LIBRARY_FILTER_KEY,
  LIBRARY_PANEL_KEY,
  OPEN_LIBRARY_KEY,
} from "./library-memory.ts";
import { documentSpaceLabel } from "./library-spaces.ts";

function read(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("document library shell", () => {
  it("keeps a stored library filter and drops anything else", () => {
    assert.equal(libraryFilter("all"), "all");
    assert.equal(libraryFilter("note"), "note");
    assert.equal(libraryFilter("diagram"), "diagram");
    assert.equal(libraryFilter(null), "all");
    assert.equal(libraryFilter("workspace"), "all");
    assert.equal(libraryFilter(""), "all");
  });

  it("keeps a stored library panel and drops anything else", () => {
    assert.equal(libraryPanel("dashboard"), "dashboard");
    assert.equal(libraryPanel("manage"), "manage");
    assert.equal(libraryPanel(null), "dashboard");
    assert.equal(libraryPanel("invite"), "dashboard");
  });

  it("names a member space and hides a workspace the viewer does not belong to", () => {
    const workspaces = [{ id: "ws-1", name: "Field notes" }];

    assert.equal(documentSpaceLabel(null, workspaces), "Personal");
    assert.equal(documentSpaceLabel("ws-1", workspaces), "Field notes");
    assert.equal(documentSpaceLabel("secret", workspaces), null);
    assert.equal(documentSpaceLabel("ws-1", []), null);
  });

  it("shares the library filter with a document and leaves the manage panel off the board", () => {
    const board = read("../components/library/document-board.tsx");
    const sidebar = read("../components/document/document-sidebar.tsx");

    assert.equal(LIBRARY_FILTER_KEY, "pamiac-library-filter");
    assert.equal(LIBRARY_PANEL_KEY, "pamiac-library-panel");
    assert.equal(OPEN_LIBRARY_KEY, "pamiac-open-library");
    assert.match(board, /LIBRARY_FILTER_KEY/);
    assert.match(board, /libraryFilter\(window\.localStorage\.getItem\(LIBRARY_FILTER_KEY\)\)/);
    assert.equal(/libraryPanel|setPanel|pamiac-library-panel/.test(board), false);
    assert.match(sidebar, /LIBRARY_FILTER_KEY/);
    assert.match(sidebar, /OPEN_LIBRARY_KEY/);
    assert.match(sidebar, /page="document"/);
    assert.equal(/LIBRARY_PANEL_KEY|onManage/.test(sidebar), false);
    assert.match(sidebar, /librarySpaces\(stored\)/);
    assert.match(sidebar, /router\.push\("\/workspace"\)/);
  });

  it("puts a signed-in document in the existing sidebar and leaves a public viewer without it", () => {
    const page = read("../app/d/[id]/page.tsx");
    const shell = read("../components/document/document-shell.tsx");
    const screen = read("../components/document-screen.tsx");
    const sidebar = read("../components/document/document-sidebar.tsx");
    const css = read("../app/globals.css");

    assert.equal(/AppHeader/.test(page), false);
    assert.match(page, /<DocumentShell/);
    assert.match(page, /email=\{user\?\.email \?\? null\}/);
    assert.match(page, /workspaceId=\{user \? bundle\.document\.workspaceId : null\}/);
    assert.match(page, /if \(user\)/);
    assert.match(page, /listMemberWorkspaces\(user\.id\)/);
    assert.match(page, /documentSpaceLabel\(bundle\.document\.workspaceId, workspaces\)/);
    assert.match(page, /<LockedDocument id=\{id\} reason=\{access\.reason\} \/>/);
    assert.match(shell, /<LibrarySidebar|<DocumentSidebar/);
    assert.match(shell, /email !== null/);
    assert.match(shell, /library-shell-solo/);
    assert.match(shell, /<CircuitBoard \/>/);
    assert.match(sidebar, /<LibrarySidebar/);
    assert.equal(/function LibrarySidebar/.test(sidebar), false);
    assert.match(sidebar, /filter=\{documentType\}/);
    assert.match(sidebar, /openLibraryId\(workspaceId, spacesQuery\.data\)/);
    assert.match(screen, /<Page className="library-main">/);
    assert.match(screen, /className="library-heading-actions topbar-tools"/);
    assert.match(screen, /<DocumentBreadcrumb kind=\{type\} spaceName=\{spaceName\} \/>/);
    assert.equal(
      /Your knowledge, connected|A shared memory for you and your agents/.test(screen),
      false,
    );
    assert.match(css, /\.library-shell \.note-sheet/);
    assert.match(css, /\.library-shell \.canvas-wrap/);
    assert.match(
      css,
      /@media \(max-width:\s*760px\)\s*\{\s*\.library-shell\s*\{\s*grid-template-columns:\s*minmax\(0,\s*1fr\);/,
    );
  });

  it("uses Button for share and delete", () => {
    const actions = read("../components/document/document-owner-actions.tsx");

    assert.match(actions, /<Button className="secondary small"/);
    assert.match(actions, /<Button className="danger small"/);
    assert.equal(/<button/.test(actions), false);
    assert.match(actions, /useMutation/);
    assert.equal(/useState/.test(actions), false);
  });
});
