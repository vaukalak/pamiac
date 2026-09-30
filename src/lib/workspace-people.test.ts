import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("adding a person to a workspace", () => {
  it("keeps the add control off personal space and out of the create form", () => {
    const board = readFileSync(
      new URL("../components/library/document-board.tsx", import.meta.url),
      "utf8",
    );
    const add = readFileSync(
      new URL("../components/library/workspace-member-add.tsx", import.meta.url),
      "utf8",
    );
    const personal = readFileSync(
      new URL("../components/library/workspace-create.tsx", import.meta.url),
      "utf8",
    );
    assert.match(add, /PERSONAL_SPACE_ID/);
    assert.match(add, /return null/);
    assert.equal(/invite/i.test(board), false);
    assert.equal(/invite/i.test(personal), false);
    assert.match(add, /<Form\.Select label="Role" name="role" options=\{roleOptions\} \/>/);
    assert.match(add, /value: "admin", label: "Admin"/);
    assert.match(add, /value: "editor", label: "Editor"/);
    assert.match(add, /role: "editor"/);
    assert.equal(/viewer|owner/.test(add), false);
  });

  it("stores a member row or emails a pending invite", () => {
    const people = readFileSync(new URL("./workspace-people.ts", import.meta.url), "utf8");
    const route = readFileSync(
      new URL("../app/api/workspaces/[id]/members/route.ts", import.meta.url),
      "utf8",
    );
    const schema = readFileSync(new URL("../db/schema.ts", import.meta.url), "utf8");
    const member = people.slice(
      people.indexOf('person.status === "member"'),
      people.indexOf("insert(workspaceInvites)"),
    );
    const pending = people.slice(people.indexOf("insert(workspaceInvites)"));
    assert.match(people, /workspaceMembers/);
    assert.match(people, /workspaceInvites/);
    assert.match(people, /actorId/);
    assert.match(people, /Workspace not found/);
    assert.match(people, /onConflictDoNothing/);
    assert.equal(/sendWorkspaceInvite/.test(member), false);
    assert.match(pending, /sendWorkspaceInvite/);
    assert.match(pending, /workspaceInvitePath/);
    const invite = schema.slice(schema.indexOf("workspace_invite"));
    assert.match(
      invite,
      /role: text\("role", \{ enum: \["admin", "editor"\] \}\)\s*\.notNull\(\)\s*\.default\("editor"\)/,
    );
    assert.match(route, /addWorkspacePerson/);
    assert.equal(/invite/i.test(route), false);
  });

  it("maps only the email check to a client error, not the account lookup", () => {
    const people = readFileSync(new URL("./workspace-people.ts", import.meta.url), "utf8");
    const mapped = people.indexOf("throw clientError");
    const lookup = people.indexOf("await accountIdForEmail");
    assert.ok(mapped > 0);
    assert.ok(lookup > mapped);
  });
});
