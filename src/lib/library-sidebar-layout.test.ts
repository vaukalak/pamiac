import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function read(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("library sidebar and create plus", () => {
  it("keeps the switcher put when the open space changes", () => {
    const board = read("../components/library/document-board.tsx");
    const choose = board.slice(
      board.indexOf("function chooseWorkspace"),
      board.indexOf("function apply"),
    );
    const remember = board.slice(
      board.indexOf("useEffect(() => {"),
      board.indexOf("function chooseView"),
    );

    assert.equal(/LibraryPanel/.test(board), false);
    assert.equal(/setPanel/.test(choose), false);
    assert.equal(/setPanel/.test(remember), false);
    assert.match(board, /pamiac-open-library/);
    assert.match(choose, /OPEN_LIBRARY_KEY/);
    assert.match(choose, /librarySpaces\(stored\)/);
  });

  it("still remembers grid or list and filters the open library", () => {
    const board = read("../components/library/document-board.tsx");

    assert.match(board, /pamiac-library-view/);
    assert.match(board, /localStorage\.setItem\(VIEW_KEY, next\)/);
    assert.match(board, /filter === "all" \|\| item\.type === filter/);
    assert.match(board, /libraryCount=\{library\.length\}/);
  });

  it("opens a named workspace form from the sidebar and rejects an empty name", () => {
    const sidebar = read("../components/library/library-sidebar-panel.tsx");
    const form = read("../components/library/workspace-create.tsx");
    const manage = read("../components/workspace-settings/workspace-settings-screen.tsx");

    assert.match(sidebar, /Add workspace/);
    assert.match(sidebar, /<WorkspaceCreate onCreated=\{onSelect\} \/>/);
    assert.match(form, /name="name"/);
    assert.match(form, /required/);
    assert.match(form, /createWorkspace/);
    assert.equal(/mutate\(\s*""\s*\)/.test(form), false);
    assert.equal(/WorkspaceCreate/.test(manage), false);
  });

  it("marks the open space and paints document create with the home lime", () => {
    const selector = read("../components/library/workspace-selector.tsx");
    const css = read("../app/globals.css");
    const plus = css.slice(
      css.indexOf(".library-shell .library-create .library-plus {"),
      css.indexOf(".library-shell .library-create .library-plus:hover"),
    );
    const trigger = css.slice(
      css.indexOf(".library-shell .workspace-selector button.workspace-switcher-trigger {"),
      css.indexOf(".library-shell .workspace-selector button.workspace-switcher-trigger:hover"),
    );
    const selected = css.slice(
      css.indexOf(
        '.library-shell .workspace-selector button.workspace-switcher-option[aria-selected="true"]',
      ),
      css.indexOf(".library-shell .workspace-switcher-check"),
    );

    assert.match(selector, /librarySpaces/);
    assert.match(selector, /<WorkspaceSwitcherMenu/);
    assert.doesNotMatch(trigger, /background:\s*var\(--home-lime\)/);
    assert.match(trigger, /color-mix\(in srgb, var\(--home-lime\)/);
    assert.doesNotMatch(selected, /background:\s*var\(--home-lime\)/);
    assert.match(plus, /background:\s*var\(--home-lime\)/);
    assert.match(plus, /color:\s*var\(--home-on-lime\)/);
    assert.match(
      css,
      /\.library-shell \.library-nav-item\[aria-current="page"\] \{[^}]*background:\s*var\(--home-lime\)/,
    );
  });

  it("bolds only the selected workspace row", () => {
    const css = read("../app/globals.css");
    const idle = css.slice(
      css.indexOf(".library-shell .workspace-selector button.workspace-switcher-option {"),
      css.indexOf(".library-shell .workspace-selector button.workspace-switcher-option:hover"),
    );
    const pressed = css.slice(
      css.indexOf(
        '.library-shell .workspace-selector button.workspace-switcher-option[aria-selected="true"]',
      ),
      css.indexOf(".library-shell .workspace-switcher-check"),
    );

    assert.match(pressed, /font-weight:\s*650/);
    assert.equal(/font-weight/.test(idle), false);
  });

  it("keeps the pending label on the note and diagram choices", () => {
    const create = read("../components/library/library-create.tsx");

    assert.match(create, /creating === "note" \? "Creating…" : "New note"/);
    assert.match(create, /creating === "diagram" \? "Creating…" : "New UML diagram"/);
    assert.match(create, /mutation\.isPending/);
    assert.equal(/useState/.test(create), false);
    const panel = create.slice(
      create.indexOf('className="menu-panel"'),
      create.indexOf("</details>"),
    );
    assert.match(panel, /<p className="error">\{message\}<\/p>/);
    assert.equal(/role="menu"|role="menuitem"/.test(create), false);
  });

  it("pins the desktop sidebar to the viewport and scrolls the nav above the footer", () => {
    const css = read("../app/globals.css");
    const panel = read("../components/library/library-sidebar-panel.tsx");
    const scroll = read("../components/library/library-sidebar-scroll.tsx");
    const desktop = css.slice(
      css.indexOf("@media (min-width: 761px) {"),
      css.indexOf(".library-shell > .library-main,"),
    );
    const mobile = css.slice(
      css.indexOf(".library-shell > .library-sidebar {\n    position: fixed;"),
      css.indexOf(".library-shell > .library-sidebar.is-open"),
    );

    assert.match(desktop, /position:\s*fixed/);
    assert.match(desktop, /top:\s*0/);
    assert.match(desktop, /bottom:\s*0/);
    assert.match(desktop, /overflow:\s*visible/);
    assert.match(desktop, /\.library-sidebar-scroll[\s\S]*overflow-y:\s*auto/);
    assert.match(panel, /<LibrarySidebarScroll[\s\S]*<LibrarySidebarFooter/);
    assert.match(scroll, /className="library-sidebar-scroll"/);
    assert.equal(/LibrarySidebarFooter/.test(scroll), false);
    assert.match(mobile, /top:\s*56px/);
    assert.match(mobile, /overflow:\s*auto/);
    assert.doesNotMatch(mobile, /library-sidebar-scroll/);
  });
});
