import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { readStylesheet } from "./stylesheet.ts";

function read(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

function block(source: string, start: string, end: string) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `${start} .. ${end}`);
  return source.slice(from, to);
}

describe("library mobile menu", () => {
  it("keeps the same sidebar on the board and the open document", () => {
    const board = read("../components/library/document-board.tsx");
    const documentSidebar = read("../components/document/document-sidebar.tsx");
    const shell = read("../components/document/document-shell.tsx");
    const menu = read("../components/library/library-sidebar.tsx");
    const panel = read("../components/library/library-sidebar-panel.tsx");

    assert.match(board, /<LibrarySidebar/);
    assert.match(documentSidebar, /<LibrarySidebar/);
    assert.match(shell, /<DocumentSidebar/);
    assert.equal(/function LibrarySidebar\(/.test(board + documentSidebar + shell), false);
    assert.match(menu, /export function LibrarySidebar/);
    assert.match(menu, /<LibrarySidebarPanel/);
    assert.equal(/export function LibrarySidebar\(/.test(panel), false);
  });

  it("labels the hamburger and the open drawer for assistive tech", () => {
    const button = read("../components/library/library-menu-button.tsx");
    const panel = read("../components/library/library-sidebar-panel.tsx");
    const menu = read("../components/library/library-sidebar.tsx");

    assert.match(button, /aria-expanded=\{open\}/);
    assert.match(button, /aria-controls=\{controls\}/);
    assert.match(button, /aria-label=\{open \? "Close menu" : "Open menu"\}/);
    assert.match(button, /type="button"/);
    assert.match(panel, /aria-modal=\{dialog \? true : undefined\}/);
    assert.match(panel, /aria-label=\{dialog \? "Library menu" : undefined\}/);
    assert.match(panel, /role=\{dialog \? "dialog" : undefined\}/);
    assert.match(panel, /id=\{menuId\}/);
    assert.match(panel, /const dialog = mobile && open/);
    assert.match(menu, /useState\(false\)/);
    assert.equal(/useMutation|isPending/.test(menu), false);
  });

  it("dismisses from the backdrop, Escape, and Close, then returns focus", () => {
    const menu = read("../components/library/library-sidebar.tsx");
    const close = read("../components/library/library-menu-close.tsx");
    const backdrop = read("../components/library/library-menu-backdrop.tsx");

    assert.match(backdrop, /onClick=\{onClose\}/);
    assert.match(close, /onClick=\{onClose\}/);
    assert.match(close, />\s*Close\s*</);
    assert.match(menu, /event\.key === "Escape"/);
    assert.match(menu, /document\.querySelector\("\.workspace-add-dialog"\)/);
    assert.match(menu, /const button = menuButton\.current/);
    assert.match(menu, /requestAnimationFrame\(\(\) => \{\s*button\?\.focus\(\)/);
  });

  it("closes for a workspace, filter, or link, and leaves add-workspace alone", () => {
    const menu = read("../components/library/library-sidebar.tsx");
    const panel = read("../components/library/library-sidebar-panel.tsx");
    const scroll = read("../components/library/library-sidebar-scroll.tsx");

    assert.match(menu, /function chooseFilter\(next: LibraryFilter\) \{\s*close\(\)/);
    assert.match(menu, /function chooseWorkspace\(workspaceId: string\) \{\s*close\(\)/);
    assert.match(panel, /onFilter=\{onFilter\}/);
    assert.match(panel, /onSelect=\{selectWorkspace\}/);
    assert.match(panel, /linked=\{page !== "library"\}/);
    assert.match(panel, /<LibrarySidebarScroll/);
    assert.match(scroll, /<LibraryWorkspaceNav page=\{page\} \/>/);
    assert.match(scroll, /<LibraryAgentsNav/);
    assert.match(panel, /<LibrarySidebarFooter/);
    assert.equal(/<LibraryRailLinks \/>/.test(panel), false);
    assert.equal(/library-rail-label">Workspace/.test(panel), false);
    assert.match(panel, /closest\("a\[href\]"\)/);
    assert.match(panel, /onOpen=\{openCreate\}/);
    assert.equal(/onOpen=\{onClose\}/.test(panel), false);
    assert.equal(/onManage/.test(panel), false);
    assert.match(panel, /<WorkspaceCreate onCreated=\{onSelect\} \/>/);
  });

  it("holds the page still while the drawer is open", () => {
    const menu = read("../components/library/library-sidebar.tsx");
    const lock = menu.slice(menu.indexOf("const scrollY"), menu.indexOf("function onKey"));

    assert.match(lock, /body\.style\.position = "fixed"/);
    assert.match(lock, /body\.style\.overflow = "hidden"/);
    assert.match(lock, /documentElement\.style\.overflow = "hidden"/);
    assert.match(lock, /window\.scrollTo\(0, scrollY\)/);
  });

  it("slides a drawer over the small screen and leaves the desktop column in place", () => {
    const css = readStylesheet();
    const stacked = block(
      css,
      "@media (max-width: 760px) {",
      "@media (prefers-reduced-motion: reduce)",
    );
    const drawer = block(
      css,
      ".library-shell > .library-sidebar {\n    position: fixed;",
      ".library-shell > .library-sidebar.is-open",
    );
    const open = block(
      css,
      ".library-shell > .library-sidebar.is-open {",
      ".library-shell > .library-sidebar .library-menu-close",
    );
    const button = block(
      css,
      ".library-shell .library-menu-button {",
      ".library-shell .library-menu-button:hover",
    );
    const shell = block(css, ".library-shell {", ".library-main {");
    const reduced = block(
      css,
      "@media (max-width: 760px) and (prefers-reduced-motion: reduce) {",
      ".library-shell > .library-main,",
    );
    const narrow = css.slice(css.lastIndexOf("@media (max-width: 760px)"));

    assert.match(shell, /grid-template-columns:\s*240px\s*minmax\(0,\s*1fr\)/);
    assert.match(stacked, /grid-template-columns:\s*minmax\(0,\s*1fr\)/);
    assert.equal(/\.library-sidebar/.test(stacked), false);
    assert.equal(/border-bottom:\s*1px solid var\(--home-hair\)/.test(stacked), false);
    assert.match(button, /display:\s*none/);
    assert.equal(/position:\s*fixed/.test(button), false);
    assert.equal(/top:\s*16px/.test(button), false);
    assert.equal(/left:\s*16px/.test(button), false);
    assert.match(
      css,
      /@media \(max-width:\s*760px\)\s*\{\s*\.library-shell \.library-menu-button\s*\{\s*display:\s*inline-flex;/,
    );
    const bar = block(css, ".library-mobile-header {", ".library-mobile-header .brand");
    assert.match(bar, /position:\s*fixed/);
    assert.match(bar, /top:\s*16px/);
    assert.match(bar, /right:\s*16px/);
    assert.match(bar, /z-index:\s*7/);
    assert.match(
      css,
      /\.library-shell \.library-mobile-header\s*\{[^}]*top:\s*0;[^}]*left:\s*0;[^}]*right:\s*0;[^}]*height:\s*56px;[^}]*border-bottom:\s*1px solid var\(--home-hair\);[^}]*background:\s*var\(--home-ground\)/,
    );
    assert.match(css, /\.library-shell \.library-menu-backdrop\s*\{[^}]*top:\s*56px/);
    assert.match(css, /\.library-shell > \.library-sidebar \.brand\s*\{\s*display:\s*none;/);
    const rail = block(css, ".library-sidebar {", ".filters {");

    assert.match(drawer, /position:\s*fixed/);
    assert.match(drawer, /top:\s*56px/);
    assert.equal(/top:\s*0/.test(drawer), false);
    assert.match(drawer, /z-index:\s*5/);
    assert.match(drawer, /background:\s*var\(--home-ground\)/);
    assert.match(rail, /border-right:\s*1px solid var\(--home-hair\)/);
    assert.equal(/border-right:\s*0/.test(drawer), false);
    assert.match(drawer, /left:\s*calc\(min\(240px,\s*100vw - 56px\) \* -1\)/);
    assert.equal(/transform:/.test(drawer + open), false);
    assert.match(open, /left:\s*0/);
    assert.match(reduced, /transition:\s*none/);
    assert.match(css, /\.library-shell:has\(\.share-backdrop\) \.library-menu-button/);
    assert.match(narrow, /padding-top:\s*72px/);
  });

  it("raises library main above the sidebar only while a document card menu is open", () => {
    const css = readStylesheet();
    const base = block(
      css,
      ".library-shell > .library-main,\n.library-shell > .library-status {",
      ".library-shell:has(.doc-menu .menu-panel) > .library-main",
    );
    const raised = block(
      css,
      ".library-shell:has(.doc-menu .menu-panel) > .library-main {",
      ".library-shell ::selection",
    );

    assert.match(base, /z-index:\s*1/);
    assert.match(raised, /z-index:\s*6/);
    assert.equal(/\.library-create/.test(raised), false);
    assert.equal(/\.library-status/.test(raised), false);
    assert.equal(/\.library-sidebar/.test(raised), false);
  });
});
