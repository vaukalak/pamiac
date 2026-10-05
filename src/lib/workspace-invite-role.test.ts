import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { readStylesheet } from "./stylesheet.ts";
import { memberRoleLabel } from "./workspace-member-view.ts";

function read(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

function block(source: string, header: string) {
  const at = source.indexOf(header);
  assert.ok(at >= 0, header);
  const open = source.indexOf("{", at);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    const character = source[index];
    if (character === "{") depth += 1;
    else if (character === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(at, index + 1);
    }
  }
  assert.fail(`unclosed ${header}`);
}

describe("invite role", () => {
  it("rejects a role other than admin or editor through the client error path", () => {
    const people = read("./workspace-people.ts");
    const attempt = people.indexOf("try {");
    const chosen = people.indexOf("addedMemberRole(role)");
    const mapped = people.indexOf("throw clientError");
    const lookup = people.indexOf("await accountIdForEmail");
    const member = people.slice(
      people.indexOf('person.status === "member"'),
      people.indexOf("insert(workspaceInvites)"),
    );
    const pending = people.slice(people.indexOf("insert(workspaceInvites)"));

    assert.match(people, /function addedMemberRole\(role: string\): WorkspaceRole/);
    assert.match(people, /role === "admin" \|\| role === "editor"/);
    assert.match(people, /Choose Admin or Editor/);
    assert.ok(attempt < chosen && chosen < mapped && mapped < lookup);
    assert.match(member, /role: memberRole/);
    assert.match(pending, /role: memberRole/);
    assert.equal(/viewer|owner/.test(people), false);
  });

  it("shows the stored Admin or Editor label on a pending invitation", () => {
    const row = read("../components/workspace-members/workspace-pending-row.tsx");
    const roster = read("./workspace-roster.ts");
    const list = roster.slice(
      roster.indexOf("export async function listWorkspaceRoster"),
      roster.indexOf("export async function changeWorkspaceMemberRole"),
    );

    assert.equal(memberRoleLabel(""), "Editor");
    assert.equal(memberRoleLabel("viewer"), "Editor");
    assert.equal(memberRoleLabel("owner"), "Editor");
    assert.match(row, /memberRoleLabel\(pending\.role\)/);
    assert.equal(/>\s*Invited\s*</.test(row), false);
    assert.match(list, /role: workspaceInvites\.role/);
    assert.match(list, /role: row\.role/);
  });

  it("stacks email and role in the invite dialog without moving the add-workspace fields", () => {
    const css = readStylesheet();
    const form = read("../components/library/workspace-member-add.tsx");
    const create = read("../components/library/workspace-create.tsx");
    const dialog = read("../components/workspace-members/workspace-members-invite-dialog.tsx");
    const panel = read("../components/workspace-members/workspace-members-invite-panel.tsx");
    const generic = block(css, ".library-shell .workspace-add-dialog .workspace-create > div {");
    const stacked = block(
      css,
      ".library-shell .workspace-add-dialog .workspace-create.workspace-member-add {",
    );
    const fields = block(
      css,
      ".library-shell .workspace-add-dialog .workspace-create.workspace-member-add > div {",
    );

    assert.ok(
      css.indexOf(".library-shell .workspace-add-dialog .workspace-create.workspace-member-add {") >
        css.indexOf(".library-shell .workspace-add-dialog .workspace-create > div {"),
    );
    assert.match(generic, /grid-row:\s*1\s*\/\s*3/);
    assert.match(stacked, /display:\s*flex/);
    assert.match(stacked, /flex-direction:\s*column/);
    assert.match(fields, /grid-row:\s*auto/);
    assert.match(form, /className="workspace-create workspace-member-add"/);
    assert.match(form, /<Form\.Input[^>]*name="email"/);
    assert.match(form, /<Form\.Select label="Role" name="role"/);
    assert.match(create, /<label htmlFor="workspace-name">/);
    assert.match(create, /<input[\s\S]*name="name"/);
    assert.equal(/workspace-member-add|Form\.Select/.test(create), false);
    assert.match(dialog, /className="share-backdrop workspace-invite-backdrop"/);
    assert.match(dialog, /onPointerDown=\{onClose\}/);
    assert.match(panel, /input\[name="email"\]/);
    assert.match(panel, /button, input, select/);
    assert.match(panel, /event\.key === "Escape"/);
  });
});
