import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";

function read(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

function block(source: string, start: string, end: string) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `${start} .. ${end}`);
  return source.slice(from, to);
}

describe("library profile corner", () => {
  it("renders the account menu once in the shared header, not in the rail", () => {
    const board = read("../components/library/document-board.tsx");
    const documentShell = read("../components/document/document-shell.tsx");
    const panel = read("../components/library/library-sidebar-panel.tsx");
    const header = read("../components/library/library-mobile-header.tsx");
    const menu = read("../components/library/library-sidebar.tsx");

    assert.equal(board.match(/<ProfileMenu /g)?.length ?? 0, 0);
    assert.equal(documentShell.match(/<ProfileMenu /g)?.length ?? 0, 0);
    assert.equal(header.match(/<ProfileMenu /g)?.length, 1);
    assert.match(board, /<LibrarySidebar[\s\S]*email=\{email\}/);
    assert.match(menu, /<LibraryMobileHeader[\s\S]*email=\{email\}/);
    assert.match(documentShell, /email !== null/);
    assert.match(documentShell, /<DocumentSidebar[\s\S]*email=\{email\}/);
    assert.ok(header.indexOf("<LibraryMenuButton") < header.indexOf("<LibraryBrand"));
    assert.ok(header.indexOf("<LibraryBrand") < header.indexOf("<ProfileMenu"));
    assert.match(panel, /<LibraryBrand \/>/);
    assert.ok(panel.indexOf("<LibraryBrand />") < panel.indexOf('className="library-rail-label"'));
    assert.equal(/ProfileMenu|library-email|email/.test(panel), false);
    assert.equal(
      existsSync(new URL("../components/library/library-account.tsx", import.meta.url)),
      false,
    );
  });

  it("pins the lime account button to the viewport corner and opens the menu downward", () => {
    const css = read("../app/globals.css");
    const corner = block(css, ".library-mobile-header {", ".library-mobile-header .brand");
    const menu = block(css, ".library-shell .profile-menu {", ".library-shell .profile-email {");
    const button = block(
      css,
      ".library-shell .profile-button {",
      ".library-shell .profile-button:hover",
    );
    const shared = block(css, ".profile-menu {", ".profile-email {");

    assert.match(corner, /position:\s*fixed/);
    assert.match(corner, /top:\s*16px/);
    assert.match(corner, /right:\s*16px/);
    assert.match(menu, /top:\s*calc\(100% \+ 8px\)/);
    assert.match(menu, /right:\s*0/);
    assert.match(menu, /bottom:\s*auto/);
    assert.match(menu, /left:\s*auto/);
    assert.match(menu, /background:\s*var\(--home-panel\)/);
    assert.equal(/bottom:\s*calc\(100% \+ 8px\)/.test(menu), false);
    assert.match(button, /border-color:\s*var\(--home-lime\)/);
    assert.match(button, /color:\s*var\(--home-lime\)/);
    assert.match(shared, /top:\s*calc\(100% \+ 8px\)/);
    assert.match(shared, /right:\s*0/);
    assert.equal(/bottom:\s*calc\(100% \+ 8px\)/.test(shared), false);
    assert.equal(/library-account|library-email/.test(css), false);
  });

  it("insets the brand and the library column so the corner button does not cover them", () => {
    const css = read("../app/globals.css");
    const brand = block(css, ".library-shell .brand {", ".library-shell .brand-mark {");
    const main = block(css, ".library-shell .library-main {", ".library-shell .library-crumb {");
    const narrow = css.slice(css.lastIndexOf("@media (max-width: 760px)"));

    assert.match(brand, /padding-right:\s*64px/);
    assert.match(main, /padding:\s*72px 72px 40px 32px/);
    assert.match(narrow, /\.library-shell > \.library-main\s*\{[^}]*padding:\s*24px 16px 32px/);
    assert.equal(/\.library-shell > \.profile\s*\{[^}]*position:\s*static/.test(narrow), false);
  });
});
