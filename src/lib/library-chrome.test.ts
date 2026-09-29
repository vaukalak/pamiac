import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { openWorkspaceName, spaceInitial, spaceTip } from "./library-spaces.ts";

function read(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("library chrome", () => {
  it("takes the first visible character of a space label", () => {
    assert.equal(spaceInitial("Personal space"), "P");
    assert.equal(spaceInitial("  field notes"), "F");
    assert.equal(spaceInitial("école"), "É");
    assert.equal(spaceInitial(" \n\t"), "");
  });

  it("keeps a space tip on one line and ends a longer label with a hyphen", () => {
    assert.equal(spaceTip("Personal space"), "Personal space");
    assert.equal(spaceTip("a".repeat(20)), "a".repeat(20));
    assert.equal(spaceTip("a".repeat(21)), `${"a".repeat(20)}-`);
    assert.equal(spaceTip(""), "");
    const emoji = "😀";
    assert.equal(emoji.length, 2);
    assert.equal(spaceTip(emoji.repeat(20)), emoji.repeat(20));
    assert.equal(spaceTip(emoji.repeat(21)), `${emoji.repeat(20)}-`);
    assert.equal(spaceTip(`${"a".repeat(19)}😀!`), `${"a".repeat(19)}😀-`);
  });

  it("names a workspace from the shared list", () => {
    const workspaces = [{ id: "ws-1", name: "  Field notes  " }];
    assert.equal(openWorkspaceName("ws-1", workspaces), "Field notes");
    assert.equal(openWorkspaceName("missing", workspaces), "");
    assert.equal(openWorkspaceName("ws-1", undefined), "");
  });

  it("keeps the personal library on the dashboard while management stays armed", () => {
    const board = read("../components/library/document-board.tsx");

    assert.match(
      board,
      /workspaceId !== PERSONAL_SPACE_ID && panel === "manage" \? \(\s*<LibraryManage[\s\S]*?\) : \(\s*<LibraryDashboard/,
    );
  });

  it("closes the new-document menu on Escape and still closes it from outside", () => {
    const create = read("../components/library/library-create.tsx");

    assert.match(create, /pointerdown/);
    assert.match(create, /details\.open = false/);
    assert.match(create, /event\.key !== "Escape"/);
    assert.match(create, /summary\.focus\(\)/);
    assert.equal(/useState/.test(create), false);
  });

  it("shows a space initial, the full name, and a tooltip", () => {
    const space = read("../components/library/workspace-space.tsx");
    const selector = read("../components/library/workspace-selector.tsx");
    const filters = read("../components/library/library-filters.tsx");
    const css = read("../app/globals.css");

    assert.match(space, /aria-label=\{label\}/);
    assert.match(space, /aria-pressed=\{pressed\}/);
    assert.match(space, /aria-hidden="true"/);
    assert.match(space, /spaceInitial\(label\)/);
    assert.match(space, /spaceTip\(label\)/);
    assert.match(space, /className="workspace-space-tip"/);
    assert.equal(/title=/.test(space), false);
    assert.equal(/FilterChip/.test(selector), false);
    assert.match(filters, /FilterChip/);
    assert.match(selector, /pressed=\{selectedId === space\.id\}/);
    assert.match(css, /button:hover \.workspace-space-tip/);
    assert.match(css, /button:focus \.workspace-space-tip/);
    assert.match(css, /button:focus-visible \.workspace-space-tip/);
    const tip = css.slice(
      css.indexOf(".workspace-space-tip {"),
      css.indexOf(".workspace-selector button:hover .workspace-space-tip"),
    );
    const sidebar = css.slice(css.indexOf(".library-sidebar {"), css.indexOf(".library-switcher"));
    const column = css.slice(
      css.indexOf(".workspace-selector {"),
      css.indexOf(".library-sidebar .workspace-create"),
    );
    assert.match(tip, /white-space:\s*nowrap/);
    assert.match(tip, /width:\s*max-content/);
    assert.equal(/overflow-wrap/.test(tip), false);
    assert.match(sidebar, /width:\s*fit-content/);
    assert.match(column, /width:\s*fit-content/);
    assert.equal(/width:\s*100%/.test(column), false);
  });

  it("opens workspace creation in a modal and closes it after create", () => {
    const sidebar = read("../components/library/library-sidebar.tsx");
    const dialog = read("../components/library/library-space-add-dialog.tsx");
    const panel = read("../components/library/library-space-add-panel.tsx");
    const heading = read("../components/library/library-space-add-heading.tsx");
    const button = read("../components/library/library-space-add-button.tsx");

    assert.equal(/<details/.test(sidebar), false);
    assert.match(button, /aria-label=\{label\}/);
    assert.match(button, /className="library-plus"/);
    assert.match(sidebar, /label="Add workspace"/);
    assert.match(sidebar, /<WorkspaceCreate onCreated=\{onSelect\} \/>/);
    assert.match(sidebar, /setCreating\(false\)/);
    assert.match(dialog, /className="share-backdrop"/);
    assert.match(dialog, /onPointerDown=\{onClose\}/);
    assert.match(panel, /className="share-dialog"/);
    assert.match(panel, /stopPropagation\(\)/);
    assert.match(panel, /event\.key === "Escape"/);
    assert.match(panel, /input\[name="name"\]/);
    assert.match(panel, /\.focus\(\)/);
    assert.match(heading, />\s*Cancel\s*</);
  });

  it("asks before leave or delete and includes the workspace name", () => {
    const leave = read("../components/library/workspace-leave.tsx");
    const remove = read("../components/library/workspace-delete.tsx");
    const leaveClick = leave.slice(leave.indexOf("onClick"), leave.indexOf('type="button"'));
    const removeClick = remove.slice(remove.indexOf("onClick"), remove.indexOf('type="button"'));

    assert.match(leave, /Leave \{label\}\?/);
    assert.match(leave, /confirming \? `Leave \$\{label\}` : "Leave workspace"/);
    assert.match(leave, />\s*Cancel\s*</);
    assert.ok(leaveClick.indexOf("setConfirming(true)") < leaveClick.indexOf("mutation.mutate()"));
    assert.match(remove, /Delete \{label\} and its documents\?/);
    assert.match(remove, /confirming \? `Delete \$\{label\}` : "Delete workspace"/);
    assert.match(remove, />\s*Cancel\s*</);
    assert.ok(
      removeClick.indexOf("setConfirming(true)") < removeClick.indexOf("mutation.mutate()"),
    );
  });

  it("sizes management to its content and does not list members", () => {
    const css = read("../app/globals.css");
    const manage = read("../components/library/library-manage.tsx");
    const route = read("../app/api/workspaces/[id]/members/route.ts");
    const card = css.slice(css.indexOf(".library-manage {"), css.indexOf(".library-manage-name"));

    assert.match(card, /width:\s*fit-content/);
    assert.match(
      css,
      /\.library-manage-danger\s*\{[^}]*border-top:\s*1px solid var\(--danger-line\)/,
    );
    assert.match(manage, /<h2 className="library-manage-name">\{name\}<\/h2>/);
    assert.match(route, /export async function POST/);
    assert.equal(/export async function GET/.test(route), false);
  });
});
