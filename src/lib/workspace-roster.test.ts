import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function read(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("workspace roster", () => {
  it("refuses a personal roster and joins the account for name and email", () => {
    const roster = read("./workspace-roster.ts");
    const gate = roster.slice(
      roster.indexOf("async function membershipFor"),
      roster.indexOf("function requireAdmin"),
    );
    const list = roster.slice(
      roster.indexOf("export async function listWorkspaceRoster"),
      roster.indexOf("export async function changeWorkspaceMemberRole"),
    );

    assert.match(gate, /Personal space has no shared members/);
    assert.match(gate, /Workspace not found/);
    assert.match(list, /membershipFor\(actorId, workspaceId\)/);
    assert.match(list, /innerJoin\(user, eq\(user\.id, workspaceMembers\.userId\)\)/);
    assert.match(list, /name: user\.name/);
    assert.match(list, /email: user\.email/);
    assert.match(list, /isoTime\(member\.createdAt\)/);
    assert.match(
      roster.slice(0, roster.indexOf("async function membershipFor")),
      /toISOString\(\)/,
    );
    assert.ok(roster.indexOf("Personal space has no shared members") < roster.indexOf("innerJoin"));
  });

  it("lets an admin change another member and refuses the actor's own role", () => {
    const roster = read("./workspace-roster.ts");
    const change = roster.slice(
      roster.indexOf("export async function changeWorkspaceMemberRole"),
      roster.indexOf("export async function resendWorkspacePending"),
    );

    assert.match(change, /isWorkspaceAdmin|requireAdmin/);
    assert.match(change, /target\.userId === actorId/);
    assert.match(change, /You cannot change your own role/);
    assert.ok(change.indexOf("You cannot change your own role") < change.indexOf(".update("));
    assert.match(change, /\.set\(\{ role \}\)/);
    assert.equal(/viewer/.test(change), false);
  });

  it("sends the stored address again without writing a role", () => {
    const roster = read("./workspace-roster.ts");
    const resend = roster.slice(roster.indexOf("export async function resendWorkspacePending"));
    const route = read("../app/api/workspaces/[id]/invites/[inviteId]/resend/route.ts");

    assert.match(resend, /sendWorkspaceInvite/);
    assert.match(resend, /workspaceInvitePath\(pending\.id\)/);
    assert.equal(/\.set\(/.test(resend), false);
    assert.equal(/role:/.test(resend), false);
    assert.match(route, /resendWorkspacePending\(user\.id, id, inviteId\)/);
  });

  it("renames through workspaceName and only for an admin", () => {
    const store = read("./workspaces.ts");
    const route = read("../app/api/workspaces/[id]/route.ts");
    const rename = store.slice(
      store.indexOf("export async function renameWorkspace"),
      store.indexOf("export async function leaveWorkspace"),
    );

    assert.match(rename, /workspaceName\(name\)/);
    assert.match(rename, /Personal space cannot be renamed/);
    assert.match(rename, /isWorkspaceAdmin/);
    assert.match(rename, /Only an admin can rename this workspace/);
    assert.ok(rename.indexOf("isWorkspaceAdmin") < rename.indexOf(".update("));
    assert.match(route, /renameWorkspace\(user\.id, id, input\.name\)/);
    assert.match(route, /export async function PATCH/);
  });

  it("signs the settings and members pages in the same way as the library", () => {
    const library = read("../app/workspace/page.tsx");
    const settings = read("../app/workspace/settings/page.tsx");
    const members = read("../app/workspace/members/page.tsx");
    const shell = read("../components/library/library-shell.tsx");

    for (const page of [settings, members]) {
      assert.match(page, /getLibrarySession\(/);
      assert.match(page, /<SetupScreen \/>/);
      assert.match(page, /redirect\(`\/login\?next=/);
      assert.match(page, /email=\{result\.session\.user\.email\}/);
      assert.match(page, /workspaces=\{workspaces\}/);
    }
    assert.match(library, /getLibrarySession\(/);
    assert.match(shell, /pamiac-open-library/);
    assert.match(shell, /openLibraryId/);
    assert.match(shell, /email=\{email\}/);
    assert.equal(/<ProfileMenu/.test(shell), false);
    assert.match(
      read("../components/library/library-mobile-header.tsx"),
      /<ProfileMenu email=\{email\} \/>/,
    );
    assert.match(read("../components/library/library-nav.tsx"), /linked \? "\/workspace"/);
  });
});
