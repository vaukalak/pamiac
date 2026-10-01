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

    assert.match(board, /useState<LibraryPanel>\("dashboard"\)/);
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
    const manage = read("../components/library/library-manage.tsx");

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
    const pressed = css.slice(
      css.indexOf('.library-shell .workspace-selector button[aria-pressed="true"]'),
      css.indexOf('.library-shell .workspace-selector button[aria-pressed="true"]:hover'),
    );

    assert.match(selector, /librarySpaces/);
    assert.match(selector, /pressed=\{selectedId === space\.id\}/);
    assert.match(pressed, /background:\s*var\(--home-lime\)/);
    assert.match(pressed, /font-weight:\s*700/);
    assert.match(plus, /background:\s*var\(--home-lime\)/);
    assert.match(plus, /color:\s*var\(--home-on-lime\)/);
  });

  it("bolds only the selected workspace row", () => {
    const css = read("../app/globals.css");
    const idle = css.slice(
      css.indexOf(".library-shell .workspace-selector button {"),
      css.indexOf(".library-shell .workspace-space-mark"),
    );
    const pressed = css.slice(
      css.indexOf('.library-shell .workspace-selector button[aria-pressed="true"]'),
      css.indexOf('.library-shell .workspace-selector button[aria-pressed="true"]:hover'),
    );

    assert.match(pressed, /font-weight:\s*700/);
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
});
