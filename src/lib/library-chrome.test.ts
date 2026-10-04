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

  it("keeps the library column on the document dashboard", () => {
    const column = read("../components/library/library-column.tsx");
    const settings = read("../app/workspace/settings/page.tsx");
    const members = read("../app/workspace/members/page.tsx");

    assert.match(column, /<LibraryDashboard/);
    assert.equal(/LibraryManage|LibrarySwitcher/.test(column), false);
    assert.match(settings, /WorkspaceSettingsScreen/);
    assert.match(members, /WorkspaceMembersScreen/);
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
    const selector = read("../components/library/workspace-selector.tsx");
    const option = read("../components/library/workspace-switcher-option.tsx");
    const menu = read("../components/library/workspace-switcher-menu.tsx");
    const filters = read("../components/library/library-filters.tsx");
    const css = read("../app/globals.css");

    assert.match(selector, /<WorkspaceSwitcherTrigger/);
    assert.match(selector, /current\?\.label/);
    assert.equal(/WorkspaceSpace/.test(selector), false);
    assert.match(option, /selected=\{current\}/);
    assert.match(option, /workspace-switcher-check/);
    assert.match(menu, /const SEARCH_AT = 8/);
    assert.match(menu, /spaces\.length >= SEARCH_AT/);
    assert.match(menu, /\+ Add workspace/);
    assert.equal(/FilterChip/.test(selector), false);
    assert.match(filters, /FilterChip/);
    assert.match(menu, /selectedId === space\.id/);
    assert.match(css, /button:hover \.workspace-space-tip/);
    assert.match(css, /button:focus \.workspace-space-tip/);
    assert.match(css, /button:focus-visible \.workspace-space-tip/);
    const tip = css.slice(
      css.indexOf(".workspace-space-tip {"),
      css.indexOf(".workspace-selector button:hover .workspace-space-tip"),
    );
    const sidebar = css.slice(css.indexOf(".library-sidebar {"), css.indexOf(".filters {"));
    const column = css.slice(
      css.indexOf(".workspace-selector {"),
      css.indexOf(".library-sidebar .workspace-create"),
    );
    assert.match(tip, /white-space:\s*nowrap/);
    assert.match(tip, /width:\s*max-content/);
    assert.equal(/overflow-wrap/.test(tip), false);
    assert.match(sidebar, /min-height:\s*100%/);
    assert.equal(/width:\s*fit-content/.test(sidebar), false);
    assert.match(column, /width:\s*fit-content/);
    assert.equal(/width:\s*100%/.test(column), false);
  });

  it("opens workspace creation in a modal and closes it after create", () => {
    const sidebar = read("../components/library/library-sidebar-panel.tsx");
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
    assert.match(panel, /className="share-dialog workspace-add-dialog"/);
    assert.match(panel, /stopPropagation\(\)/);
    assert.match(panel, /event\.key === "Escape"/);
    assert.match(panel, /input\[name="name"\]/);
    assert.match(panel, /\.focus\(\)/);
    assert.match(heading, />\s*Cancel\s*</);
  });

  it("spaces the add-workspace dialog like the support panel", () => {
    const css = read("../app/globals.css");
    const dialog = css.slice(
      css.indexOf(".library-shell .workspace-add-dialog {"),
      css.indexOf(".library-shell .workspace-add-dialog .share-dialog-head"),
    );
    const head = css.slice(
      css.indexOf(".library-shell .workspace-add-dialog .share-dialog-head"),
      css.indexOf(".library-shell .workspace-add-dialog h2"),
    );
    const form = css.slice(
      css.indexOf(".library-shell .workspace-add-dialog .workspace-create {"),
      css.indexOf(".library-shell .workspace-add-dialog .workspace-create label"),
    );
    const label = css.slice(
      css.indexOf(".library-shell .workspace-add-dialog .workspace-create label"),
      css.indexOf(".library-shell .workspace-add-dialog .workspace-create button,"),
    );
    const action = css.slice(
      css.indexOf(".library-shell .workspace-add-dialog .workspace-create button {"),
      css.indexOf(".library-shell .workspace-add-dialog .workspace-create button:hover"),
    );

    assert.match(dialog, /padding:\s*28px/);
    assert.match(head, /margin-bottom:\s*20px/);
    assert.match(form, /margin:\s*0/);
    assert.match(label, /margin-bottom:\s*6px/);
    assert.match(action, /margin-top:\s*14px/);
    assert.match(action, /width:\s*100%/);
  });

  it("asks before leave or delete and includes the workspace name", () => {
    const leave = read("../components/workspace-settings/workspace-settings-leave-actions.tsx");
    const remove = read("../components/workspace-settings/workspace-settings-delete-actions.tsx");
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

  it("shows workspace details on settings and loads people from the members route", () => {
    const css = read("../app/globals.css");
    const settings = read("../components/workspace-settings/workspace-settings-details.tsx");
    const route = read("../app/api/workspaces/[id]/members/route.ts");
    const danger = css.slice(
      css.indexOf(".library-shell .workspace-danger {"),
      css.indexOf(".library-shell .workspace-settings-card h2"),
    );

    assert.match(settings, /Workspace details/);
    assert.match(settings, /<WorkspaceSettingsMark/);
    assert.equal(/WorkspaceMemberRow/.test(settings), false);
    assert.match(route, /export async function POST/);
    assert.match(route, /export async function GET/);
    assert.match(route, /listWorkspaceRoster/);
    assert.equal(/invite/i.test(route), false);
    assert.match(danger, /border-color:\s*var\(--danger\)/);
  });
});
