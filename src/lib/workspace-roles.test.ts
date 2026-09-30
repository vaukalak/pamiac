import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  isWorkspaceAdmin,
  managesWorkspace,
  PERSONAL_SPACE_ID,
  workspaceRole,
} from "./library-spaces.ts";

describe("workspace roles", () => {
  it("makes the creator an admin and a person added by email an editor", () => {
    assert.equal(workspaceRole("creator"), "admin");
    assert.equal(workspaceRole("added"), "editor");
    assert.equal(isWorkspaceAdmin("admin"), true);
    assert.equal(isWorkspaceAdmin("editor"), false);
    assert.equal(isWorkspaceAdmin("viewer"), false);
    assert.equal(isWorkspaceAdmin(null), false);
    assert.equal(isWorkspaceAdmin(undefined), false);
  });

  it("lets an admin manage the open workspace and keeps editors and personal space out", () => {
    const workspaces = [
      { id: "ws-1", name: "Atlas", role: "admin" as const },
      { id: "ws-2", name: "Field notes", role: "editor" as const },
    ];
    assert.equal(managesWorkspace("ws-1", workspaces), true);
    assert.equal(managesWorkspace("ws-2", workspaces), false);
    assert.equal(managesWorkspace("missing", workspaces), false);
    assert.equal(managesWorkspace(PERSONAL_SPACE_ID, workspaces), false);
    assert.equal(
      managesWorkspace(PERSONAL_SPACE_ID, [
        { id: PERSONAL_SPACE_ID, name: "Personal", role: "admin" },
      ]),
      false,
    );
    assert.equal(managesWorkspace("ws-3", [{ id: "ws-3", name: "Bare" }]), false);
  });

  it("stores admin or editor on membership and not on the invite", () => {
    const schema = readFileSync(new URL("../db/schema.ts", import.meta.url), "utf8");
    const member = schema.slice(
      schema.indexOf('"workspace_member"'),
      schema.indexOf('"workspace_invite"'),
    );
    const invite = schema.slice(schema.indexOf('"workspace_invite"'));
    assert.match(member, /role: text\("role", \{ enum: \["admin", "editor"\] \}\)\.notNull\(\)/);
    assert.equal(/viewer/.test(member), false);
    assert.equal(/role/i.test(invite), false);
  });

  it("keeps every member, including an editor, on the library list", () => {
    const store = readFileSync(new URL("./workspaces.ts", import.meta.url), "utf8");
    const list = store.slice(
      store.indexOf("export async function listMemberWorkspaces"),
      store.indexOf("export async function createNamedWorkspace"),
    );
    const create = store.slice(store.indexOf("export async function createNamedWorkspace"));
    const where = list.slice(list.indexOf(".where"));
    assert.match(list, /role: workspaceMembers\.role/);
    assert.equal(/admin|editor/.test(where), false);
    assert.match(create, /workspaceRole\("creator"\)/);
    assert.match(create, /role,/);
    assert.equal(/workspaceRole\("added"\)/.test(create), false);
    assert.equal(/viewer/.test(store), false);
  });

  it("refuses editors before an invite is sent and stores added people as editors", () => {
    const people = readFileSync(new URL("./workspace-people.ts", import.meta.url), "utf8");
    const route = readFileSync(
      new URL("../app/api/workspaces/[id]/members/route.ts", import.meta.url),
      "utf8",
    );
    const add = people.slice(people.indexOf("export async function addWorkspacePerson"));
    assert.match(add, /isWorkspaceAdmin/);
    assert.match(add, /Only an admin can add people/);
    assert.match(add, /workspaceRole\("added"\)/);
    assert.ok(add.indexOf("isWorkspaceAdmin") < add.indexOf("sendWorkspaceInvite"));
    assert.ok(add.indexOf("Only an admin can add people") < add.indexOf('workspaceRole("added")'));
    assert.equal(/workspaceRole\("creator"\)/.test(add), false);
    assert.equal(/viewer/.test(add), false);
    assert.match(route, /addWorkspacePerson/);
    assert.equal(/workspaceMembers/.test(route), false);
  });

  it("joins an accepted invite as an editor", () => {
    const source = readFileSync(new URL("./workspace-invites.ts", import.meta.url), "utf8");
    const accept = source.slice(
      source.indexOf("export async function acceptWorkspaceInvite"),
      source.indexOf("export async function rejectWorkspaceInvite"),
    );
    const reject = source.slice(source.indexOf("export async function rejectWorkspaceInvite"));
    assert.match(accept, /workspaceRole\("added"\)/);
    assert.equal(/workspaceRole\("creator"\)/.test(accept), false);
    assert.equal(/viewer/.test(source), false);
    assert.equal(/workspaceMembers/.test(reject), false);
  });

  it("shows add to admins and still opens the library for editors", () => {
    const board = readFileSync(
      new URL("../components/library/document-board.tsx", import.meta.url),
      "utf8",
    );
    const column = readFileSync(
      new URL("../components/library/library-column.tsx", import.meta.url),
      "utf8",
    );
    const invite = readFileSync(
      new URL("../components/workspace-members/workspace-members-invite.tsx", import.meta.url),
      "utf8",
    );
    const links = readFileSync(
      new URL("../components/library/library-workspace-links.tsx", import.meta.url),
      "utf8",
    );
    const sidebar = readFileSync(
      new URL("../components/library/library-sidebar.tsx", import.meta.url),
      "utf8",
    );
    const documents = readFileSync(new URL("./documents.ts", import.meta.url), "utf8");
    const gate = documents.slice(
      documents.indexOf("async function memberLibraryId"),
      documents.indexOf("export async function placeDocumentInWorkspace"),
    );
    assert.equal(/managesWorkspace/.test(board), false);
    assert.match(invite, /managesWorkspace/);
    assert.match(invite, /if \(!managing\) return null/);
    assert.match(invite, /<WorkspaceMemberAdd/);
    assert.equal(/WorkspacePaywall/.test(board), false);
    assert.equal(/WorkspacePaywall/.test(invite), false);
    assert.match(sidebar, /<WorkspaceSelector/);
    assert.match(sidebar, /<WorkspaceCreate/);
    assert.equal(/LibrarySwitcher/.test(column), false);
    assert.match(column, /<LibraryDashboard/);
    assert.match(links, /Workspace settings/);
    assert.match(links, /label="Members"/);
    assert.equal(/viewer/.test(board + invite + links), false);
    assert.equal(/admin|editor|role/.test(gate), false);
  });
});
