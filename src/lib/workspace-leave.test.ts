import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { resolveAccess } from "./access.ts";
import {
  documentsInSpace,
  librarySpaces,
  openLibraryId,
  PERSONAL_SPACE_ID,
} from "./library-spaces.ts";
import { leaveWorkspace } from "./library-workspaces.ts";

describe("member leaving a workspace", () => {
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

  it("removes that membership for an editor or an admin and leaves the workspace and its documents", () => {
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
    assert.equal(/isWorkspaceAdmin|Only an admin can leave|\brole\b/.test(leave), false);
    assert.ok(leave.indexOf("Workspace not found") < leave.indexOf("delete(workspaceMembers)"));
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
    assert.match(board, /<WorkspaceLeave key=\{workspaceId\} workspaceId=\{workspaceId\} \/>/);
    assert.equal(/\{managing \? <WorkspaceLeave/.test(board), false);
    assert.match(leave, /workspacesQueryKey/);
    assert.match(leave, /workspace\.id !== workspaceId/);
    assert.match(leave, /PERSONAL_SPACE_ID/);
    assert.equal(/documents/.test(leave), false);
    assert.equal(/delete\(workspaces\)/.test(leave), false);
  });

  it("closes read and edit on the member path as soon as the membership is gone", () => {
    const former = {
      isOwner: false,
      visibility: "private" as const,
      viewerEmail: null as string | null,
      allowedEmails: [] as string[],
      passwordOk: false,
      workspaceMember: false,
    };
    assert.deepEqual(resolveAccess(former), { level: "none" });
    assert.deepEqual(resolveAccess({ ...former, workspaceMember: true }), {
      level: "edit",
      reason: "member",
    });

    const documents = readFileSync(new URL("./documents.ts", import.meta.url), "utf8");
    const page = readFileSync(new URL("../app/d/[id]/page.tsx", import.meta.url), "utf8");
    const route = readFileSync(
      new URL("../app/api/documents/[id]/route.ts", import.meta.url),
      "utf8",
    );
    const member = documents.slice(
      documents.indexOf("export async function isDocumentWorkspaceMember"),
      documents.indexOf("export async function getEditableDocument"),
    );
    const editable = documents.slice(
      documents.indexOf("export async function getEditableDocument"),
      documents.indexOf("export async function getDocumentBundle"),
    );
    const write = documents.slice(
      documents.indexOf("export async function updateDocumentContent"),
      documents.indexOf("export async function deleteDocument"),
    );
    const read = route.slice(
      route.indexOf("export async function GET"),
      route.indexOf("export async function PATCH"),
    );

    assert.match(member, /if \(!workspaceId\) return false/);
    assert.match(member, /eq\(workspaceMembers\.userId, userId\)/);
    assert.equal(/\brole\b|isWorkspaceAdmin/.test(member), false);
    assert.match(editable, /isDocumentWorkspaceMember\(userId, document\.workspaceId\)/);
    assert.match(editable, /return null/);
    assert.match(write, /current\.ownerId !== userId && !workspaceMember/);
    assert.match(write, /Document not found/);
    assert.match(read, /getEditableDocument\(user\.id, id\)/);
    assert.match(read, /Document not found/);
    assert.match(page, /isDocumentWorkspaceMember\(user\.id, bundle\.document\.workspaceId\)/);
    assert.match(page, /if \(access\.level === "none"\) notFound\(\)/);
  });

  it("keeps a former editor out of the workspace library and lets them post leave", () => {
    const documents = readFileSync(new URL("./documents.ts", import.meta.url), "utf8");
    const route = readFileSync(
      new URL("../app/api/workspaces/[id]/leave/route.ts", import.meta.url),
      "utf8",
    );
    const control = readFileSync(
      new URL("../components/library/workspace-leave.tsx", import.meta.url),
      "utf8",
    );
    const gate = documents.slice(
      documents.indexOf("async function memberLibraryId"),
      documents.indexOf("export async function placeDocumentInWorkspace"),
    );
    const list = documents.slice(
      documents.indexOf("export async function listSpaceDocuments"),
      documents.indexOf("export async function createDocument"),
    );
    const former = {
      isOwner: false,
      viewerEmail: null as string | null,
      allowedEmails: [] as string[],
      passwordOk: false,
      workspaceMember: false,
    };

    for (const visibility of ["public", "password", "emails"] as const) {
      const access = resolveAccess({ ...former, visibility });
      assert.equal(access.level === "edit", false);
      assert.equal("reason" in access && access.reason === "member", false);
    }
    assert.match(gate, /if \(!member\) throw new HttpError\(404, "Workspace not found"\)/);
    assert.equal(/isWorkspaceAdmin|\brole\b/.test(gate), false);
    assert.match(gate, /eq\(workspaceMembers\.userId, ownerId\)/);
    assert.match(list, /memberLibraryId\(ownerId, workspaceId\)/);
    assert.equal(/isWorkspaceAdmin|\brole\b/.test(route), false);
    assert.equal(/isWorkspaceAdmin|managesWorkspace|\brole\b/.test(control), false);
  });
});
