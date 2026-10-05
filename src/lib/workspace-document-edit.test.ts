import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { resolveAccess } from "./access.ts";

const stranger = {
  isOwner: false,
  viewerEmail: null as string | null,
  allowedEmails: [] as string[],
  passwordOk: false,
};

describe("workspace member content edit", () => {
  it("lets a member edit every link mode and leaves a non-member on that link", () => {
    for (const visibility of ["private", "public", "password", "emails"] as const) {
      assert.deepEqual(resolveAccess({ ...stranger, visibility, workspaceMember: true }), {
        level: "edit",
        reason: "member",
      });
    }
    assert.equal(
      resolveAccess({ ...stranger, visibility: "public", workspaceMember: false }).level,
      "view",
    );
    assert.equal(
      resolveAccess({ ...stranger, visibility: "password", workspaceMember: false }).level,
      "locked",
    );
    assert.equal(
      resolveAccess({
        ...stranger,
        visibility: "emails",
        workspaceMember: false,
        allowedEmails: ["ada@example.com"],
      }).level,
      "locked",
    );
    assert.equal(
      resolveAccess({
        ...stranger,
        isOwner: true,
        visibility: "emails",
        workspaceMember: true,
      }).reason,
      "owner",
    );
  });

  it("matches either role on this workspace and ignores link visibility", () => {
    const store = readFileSync(new URL("./documents.ts", import.meta.url), "utf8");
    const member = store.slice(
      store.indexOf("export async function isDocumentWorkspaceMember"),
      store.indexOf("export async function getEditableDocument"),
    );
    const editable = store.slice(
      store.indexOf("export async function getEditableDocument"),
      store.indexOf("export async function getDocumentBundle"),
    );
    const write = store.slice(
      store.indexOf("export async function updateDocumentContent"),
      store.indexOf("export async function deleteDocument"),
    );
    const remove = store.slice(
      store.indexOf("export async function deleteDocument"),
      store.indexOf("export async function reorderDocuments"),
    );
    const share = store.slice(
      store.indexOf("export async function updateShare"),
      store.indexOf("async function upsertEmbedding"),
    );
    const setAt = write.indexOf(".set({");
    const saved = write.slice(setAt, write.indexOf(".where(eq(documents.id, id))", setAt));

    assert.match(member, /if \(!workspaceId\) return false/);
    assert.match(member, /eq\(workspaceMembers\.workspaceId, workspaceId\)/);
    assert.match(member, /eq\(workspaceMembers\.userId, userId\)/);
    assert.equal(/isWorkspaceAdmin|admin|editor|\brole\b/.test(member), false);
    assert.match(editable, /document\.ownerId === userId/);
    assert.match(editable, /isDocumentWorkspaceMember\(userId, document\.workspaceId\)/);
    assert.match(editable, /return null/);
    assert.equal(/visibility/.test(editable), false);
    assert.match(write, /isDocumentWorkspaceMember\(userId, current\.workspaceId\)/);
    assert.match(write, /current\.ownerId !== userId && !workspaceMember/);
    assert.equal(saved.includes("workspaceId"), false);
    assert.equal(saved.includes("visibility"), false);
    assert.equal(saved.includes("ownerId"), false);
    assert.match(remove, /getOwnedDocument/);
    assert.equal(/isDocumentWorkspaceMember|getEditableDocument/.test(remove), false);
    assert.match(share, /getOwnedDocument/);
    assert.equal(/isDocumentWorkspaceMember|getEditableDocument/.test(share), false);
  });

  it("opens the owner save routes to a member and leaves delete on the owner", () => {
    const route = readFileSync(
      new URL("../app/api/documents/[id]/route.ts", import.meta.url),
      "utf8",
    );
    const version = readFileSync(
      new URL("../app/api/documents/[id]/version/route.ts", import.meta.url),
      "utf8",
    );
    const remove = route.slice(route.indexOf("export async function DELETE"));
    const read = route.slice(
      route.indexOf("export async function GET"),
      route.indexOf("export async function PATCH"),
    );
    const patch = route.slice(
      route.indexOf("export async function PATCH"),
      route.indexOf("export async function DELETE"),
    );

    assert.match(read, /getEditableDocument\(user\.id, id\)/);
    assert.equal(/getOwnedDocument/.test(read), false);
    assert.match(patch, /updateDocumentContent\(user\.id, id/);
    assert.equal(/updateShare|deleteDocument/.test(patch), false);
    assert.match(remove, /deleteDocument\(user\.id, id\)/);
    assert.equal(/getEditableDocument|isDocumentWorkspaceMember/.test(remove), false);
    assert.match(version, /getEditableDocument\(user\.id, id\)/);
    assert.equal(/getOwnedDocument/.test(version), false);
  });

  it("edits title and content for a member and keeps share and delete on the owner", () => {
    const screen = readFileSync(
      new URL("../components/document-screen.tsx", import.meta.url),
      "utf8",
    );
    const page = readFileSync(new URL("../app/d/[id]/page.tsx", import.meta.url), "utf8");
    const tools = screen.slice(screen.indexOf("topbar-tools"), screen.indexOf("editor-shell"));

    assert.match(tools, /<SaveState canEdit=\{canEdit\} id=\{id\} \/>/);
    assert.match(tools, /\{isOwner \? \(/);
    assert.match(
      tools,
      /<DocumentOwnerActions id=\{id\} kind=\{type\} onShare=\{\(\) => setSharing\(true\)\} \/>/,
    );
    assert.equal(/\{canEdit \? \(/.test(tools), false);
    assert.match(screen, /<NoteDocument[\s\S]*canEdit=\{canEdit\}/);
    assert.match(screen, /<UmlEditor editable=\{canEdit\}/);
    assert.match(
      page,
      /const workspaceMember = user\s*\?\s*await isDocumentWorkspaceMember\(user\.id, bundle\.document\.workspaceId\)\s*: false/,
    );
    assert.match(page, /canEdit=\{access\.level === "edit"\}/);
    assert.match(page, /isOwner=\{access\.level === "edit" && access\.reason === "owner"\}/);
  });
});
