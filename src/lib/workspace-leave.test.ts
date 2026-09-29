import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  documentsInSpace,
  librarySpaces,
  openLibraryId,
  PERSONAL_SPACE_ID,
} from "./library-spaces.ts";
import { leaveWorkspace } from "./library-workspaces.ts";

describe("creator leaving a workspace", () => {
  it("posts to the leave route and does not send the library", async () => {
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
      await leaveWorkspace("ws 1");
      assert.equal(url, "/api/workspaces/ws%201/leave");
      assert.equal(method, "POST");
      assert.equal(body, "");
    } finally {
      globalThis.fetch = original;
    }
  });

  it("shows the server refusal when an admin cannot leave", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = async () =>
      Response.json({ error: "Personal space has no members" }, { status: 400 });
    try {
      await assert.rejects(leaveWorkspace("personal"), /Personal space has no members/);
    } finally {
      globalThis.fetch = original;
    }
  });

  it("removes only that admin membership and leaves the workspace and its documents", () => {
    const store = readFileSync(new URL("./workspaces.ts", import.meta.url), "utf8");
    const route = readFileSync(
      new URL("../app/api/workspaces/[id]/leave/route.ts", import.meta.url),
      "utf8",
    );
    const schema = readFileSync(new URL("../db/schema.ts", import.meta.url), "utf8");
    const leave = store.slice(store.indexOf("export async function leaveWorkspace"));
    const documentTable = schema.slice(
      schema.indexOf("export const documents"),
      schema.indexOf("export const documentShares"),
    );
    assert.match(leave, /PERSONAL_SPACE_ID/);
    assert.match(leave, /Personal space has no members/);
    assert.match(leave, /Workspace not found/);
    assert.match(leave, /isWorkspaceAdmin/);
    assert.match(leave, /Only an admin can leave/);
    assert.ok(leave.indexOf("isWorkspaceAdmin") < leave.indexOf("delete(workspaceMembers)"));
    assert.match(leave, /eq\(workspaceMembers\.id, membership\.id\)/);
    assert.equal(/delete\(workspaces\)/.test(leave), false);
    assert.equal(/documents/.test(leave), false);
    assert.equal(/workspaceId: null/.test(leave), false);
    assert.match(route, /leaveWorkspace\(user\.id, id\)/);
    assert.equal(/delete\(workspaces\)/.test(route), false);
    assert.equal(/workspaceId: null/.test(route), false);
    assert.match(documentTable, /onDelete: "set null"/);
  });

  it("drops the workspace from the selector and keeps its document out of the personal library", () => {
    const board = readFileSync(
      new URL("../components/library/document-board.tsx", import.meta.url),
      "utf8",
    );
    const leave = readFileSync(
      new URL("../components/library/workspace-leave.tsx", import.meta.url),
      "utf8",
    );
    const documents = [
      { id: "shared-note", workspaceId: "ws-1" },
      { id: "personal-note", workspaceId: null },
    ];
    const afterLeaving: { id: string; name: string; role: "admin" }[] = [];
    const open = openLibraryId("ws-1", afterLeaving);
    assert.equal(open, PERSONAL_SPACE_ID);
    assert.deepEqual(
      librarySpaces(afterLeaving).map((space) => space.id),
      [PERSONAL_SPACE_ID],
    );
    assert.deepEqual(
      documentsInSpace(open, documents, afterLeaving).map((document) => document.id),
      ["personal-note"],
    );
    assert.equal(documents[0]?.workspaceId, "ws-1");
    assert.match(board, /\{managing \? <WorkspaceLeave/);
    assert.match(leave, /workspacesQueryKey/);
    assert.match(leave, /workspace\.id !== workspaceId/);
    assert.match(leave, /PERSONAL_SPACE_ID/);
    assert.equal(/documents/.test(leave), false);
    assert.equal(/delete\(workspaces\)/.test(leave), false);
  });
});
