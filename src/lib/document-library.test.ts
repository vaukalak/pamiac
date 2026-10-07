import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { readStylesheet } from "./stylesheet.ts";
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

function block(source: string, start: string, end: string) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `${start} .. ${end}`);
  return source.slice(from, to);
}

function expect(actual: string) {
  return {
    toMatch(pattern: RegExp) {
      assert.match(actual, pattern);
    },
  };
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
    const css = readStylesheet();

    assert.equal(/AppHeader/.test(page), false);
    assert.match(page, /<DocumentShell/);
    assert.match(page, /email=\{user\?\.email \?\? null\}/);
    assert.match(page, /workspaceId=\{user \? bundle\.document\.workspaceId : null\}/);
    assert.match(page, /if \(user\)/);
    assert.match(page, /listMemberWorkspaces\(user\.id\)/);
    assert.match(page, /documentSpaceLabel\(bundle\.document\.workspaceId, workspaces\)/);
    assert.match(page, /<LockedDocument[\s\S]*reason=\{access\.reason\}/);
    assert.match(shell, /<LibrarySidebar|<DocumentSidebar/);
    assert.match(shell, /email !== null/);
    assert.match(shell, /library-shell-solo/);
    assert.match(shell, /<CircuitBoard \/>/);
    assert.match(shell, /email === null \? <LibraryBrand href="\/" \/> : null/);
    assert.equal(/AppHeader/.test(shell), false);
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

  it("puts one home brand on the solo shell and leaves the signed-in shell with the workspace brand", () => {
    const shell = read("../components/document/document-shell.tsx");
    const sidebar = read("../components/library/library-sidebar-panel.tsx");
    const header = read("../components/library/library-mobile-header.tsx");
    const css = readStylesheet();
    const signedIn = shell.slice(shell.indexOf("email !== null ?"));
    const shared = block(css, ".library-shell .brand {", ".library-shell .brand-mark {");
    const solo = block(
      css,
      ".library-shell.library-shell-solo > .brand {",
      ".library-shell.library-shell-solo > .library-main {",
    );

    expect(signedIn).toMatch(/<DocumentSidebar/);
    assert.equal(signedIn.includes("<LibraryBrand"), false);
    expect(sidebar).toMatch(/<LibraryBrand \/>/);
    expect(header).toMatch(/<LibraryBrand \/>/);
    assert.equal(/<LibraryBrand href="\/"/.test(sidebar), false);
    assert.equal(/<LibraryBrand href="\/"/.test(header), false);
    expect(shared).toMatch(/padding-right:\s*64px/);
    expect(solo).toMatch(/z-index:\s*2/);
    expect(solo).toMatch(/align-self:\s*start/);
    expect(solo).toMatch(/padding-right:\s*0/);
    expect(solo).toMatch(/margin:\s*22px 0 0 32px/);
    expect(css).toMatch(/\.library-shell \.library-main\s*\{[^}]*padding:\s*72px 72px 40px 32px/);
  });

  it("uses Button for share and delete", () => {
    const actions = read("../components/document/document-owner-actions.tsx");

    assert.match(actions, /<Button className="secondary small"/);
    assert.match(actions, /<Button[\s\S]*className="danger icon-button"/);
    assert.equal(/<button/.test(actions), false);
    assert.match(actions, /useMutation/);
    assert.equal(/useState/.test(actions), false);
  });
});
