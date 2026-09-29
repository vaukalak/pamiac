import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  documentsInSpace,
  librarySpaces,
  openLibraryId,
  PERSONAL_SPACE_ID,
} from "./library-spaces.ts";
import { deleteWorkspace } from "./library-workspaces.ts";

describe("deleting a workspace", () => {
  it("sends DELETE for that workspace and does not post its documents", async () => {
    const original = globalThis.fetch;
    let url = "";
    let method = "";
    let body = "";
    globalThis.fetch = async (input, init) => {
      url = String(input);
      method = String(init?.method ?? "");
      body = String(init?.body ?? "");
      return Response.json({ ok: true });
    };
    try {
      await deleteWorkspace("ws 1");
      assert.equal(url, "/api/workspaces/ws%201");
      assert.equal(method, "DELETE");
      assert.equal(body, "");
    } finally {
      globalThis.fetch = original;
    }
  });

  it("shows the server refusal when an editor or personal space cannot be deleted", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = async () =>
      Response.json({ error: "Only an admin can delete a workspace" }, { status: 403 });
    try {
      await assert.rejects(deleteWorkspace("ws-1"), /Only an admin can delete a workspace/);
    } finally {
      globalThis.fetch = original;
    }

    globalThis.fetch = async () =>
      Response.json({ error: "Personal space cannot be deleted" }, { status: 400 });
    try {
      await assert.rejects(deleteWorkspace("personal"), /Personal space cannot be deleted/);
    } finally {
      globalThis.fetch = original;
    }
  });

  it("lets an admin delete the workspace and its documents, and refuses an editor and personal space", () => {
    const store = readFileSync(new URL("./workspace-delete.ts", import.meta.url), "utf8");
    const route = readFileSync(
      new URL("../app/api/workspaces/[id]/route.ts", import.meta.url),
      "utf8",
    );
    const schema = readFileSync(new URL("../db/schema.ts", import.meta.url), "utf8");
    const remove = store.slice(store.indexOf("export async function deleteWorkspace"));
    const documentTable = schema.slice(
      schema.indexOf("export const documents"),
      schema.indexOf("export const documentShares"),
    );
    const memberTable = schema.slice(
      schema.indexOf("export const workspaceMembers"),
      schema.indexOf("export const workspaceInvites"),
    );
    const inviteTable = schema.slice(
      schema.indexOf("export const workspaceInvites"),
      schema.indexOf("export const documents"),
    );

    assert.match(remove, /PERSONAL_SPACE_ID/);
    assert.match(remove, /Personal space cannot be deleted/);
    assert.match(remove, /Workspace not found/);
    assert.match(remove, /isWorkspaceAdmin/);
    assert.match(remove, /Only an admin can delete a workspace/);
    assert.ok(
      remove.indexOf("Personal space cannot be deleted") < remove.indexOf("delete(documents)"),
    );
    assert.ok(remove.indexOf("isWorkspaceAdmin") < remove.indexOf("delete(documents)"));
    assert.ok(
      remove.indexOf("Only an admin can delete a workspace") < remove.indexOf("delete(workspaces)"),
    );
    assert.match(remove, /eq\(documents\.workspaceId, workspaceId\)/);
    assert.ok(remove.indexOf("delete(documents)") < remove.indexOf("delete(workspaces)"));
    assert.equal(/workspaceId:\s*null/.test(remove), false);
    assert.equal(/\.set\(/.test(remove), false);
    assert.match(route, /deleteWorkspace\(user\.id, id\)/);
    assert.match(route, /export async function DELETE/);
    assert.match(documentTable, /onDelete: "cascade"/);
    assert.equal(/onDelete: "set null"/.test(documentTable), false);
    assert.match(memberTable, /onDelete: "cascade"/);
    assert.match(inviteTable, /onDelete: "cascade"/);
  });

  it("drops the workspace from every selector and keeps its documents out of personal libraries", () => {
    const manage = readFileSync(
      new URL("../components/library/library-manage.tsx", import.meta.url),
      "utf8",
    );
    const danger = readFileSync(
      new URL("../components/library/library-manage-danger.tsx", import.meta.url),
      "utf8",
    );
    const control = readFileSync(
      new URL("../components/library/workspace-delete.tsx", import.meta.url),
      "utf8",
    );
    const documents = [
      { id: "shared-note", workspaceId: "ws-1" },
      { id: "personal-note", workspaceId: null },
      { id: "other-note", workspaceId: "ws-2" },
    ];
    const afterDelete = [{ id: "ws-2", name: "Field notes", role: "editor" as const }];
    const open = openLibraryId("ws-1", afterDelete);
    const kept = documents.filter((document) => document.workspaceId !== "ws-1");

    assert.equal(open, PERSONAL_SPACE_ID);
    assert.deepEqual(
      librarySpaces(afterDelete).map((space) => space.id),
      [PERSONAL_SPACE_ID, "ws-2"],
    );
    assert.deepEqual(
      documentsInSpace(open, documents, afterDelete).map((document) => document.id),
      ["personal-note"],
    );
    assert.deepEqual(
      kept.map((document) => document.id),
      ["personal-note", "other-note"],
    );
    assert.equal(documents[0]?.workspaceId, "ws-1");
    assert.match(manage, /<LibraryManageDanger/);
    assert.match(
      danger,
      /\{managing \? <WorkspaceDelete key=\{workspaceId\} workspaceId=\{workspaceId\} \/> : null\}/,
    );
    assert.equal(/\{managing \? <WorkspaceLeave/.test(danger), false);
    assert.match(control, /workspacesQueryKey/);
    assert.match(control, /libraryItemsQueryKey/);
    assert.match(control, /workspace\.id !== workspaceId/);
    assert.match(control, /document\.workspaceId !== workspaceId/);
    assert.match(control, /PERSONAL_SPACE_ID/);
    assert.equal(/workspaceId:\s*null/.test(control), false);
  });
});
