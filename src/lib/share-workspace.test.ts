import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { adminWorkspaces, shareWorkspaceBody } from "./share-workspace.ts";

describe("share workspace choice", () => {
  const atlas = { id: "ws-1", name: "Atlas", role: "admin" as const };
  const notes = { id: "ws-2", name: "Field notes", role: "editor" as const };

  it("lists workspaces the signed-in account administers", () => {
    assert.deepEqual(
      adminWorkspaces([atlas, notes, { id: "ws-3", name: "Bare" }]).map(
        (workspace) => workspace.id,
      ),
      ["ws-1"],
    );
    assert.deepEqual(adminWorkspaces([notes]), []);
  });

  it("sends a chosen workspace and sends null when that choice is cleared", () => {
    assert.deepEqual(shareWorkspaceBody(null, "ws-1", [atlas, notes]), { workspaceId: "ws-1" });
    assert.deepEqual(shareWorkspaceBody("ws-1", "ws-1", [atlas, notes]), { workspaceId: "ws-1" });
    assert.deepEqual(shareWorkspaceBody("ws-1", null, [atlas]), { workspaceId: null });
    assert.deepEqual(shareWorkspaceBody("ws-2", "ws-1", [atlas, notes]), { workspaceId: "ws-1" });
  });

  it("omits the workspace for an editor and for a library they do not administer", () => {
    assert.deepEqual(shareWorkspaceBody(null, null, [notes]), {});
    assert.deepEqual(shareWorkspaceBody("ws-2", null, [notes]), {});
    assert.deepEqual(shareWorkspaceBody("ws-2", "ws-2", [atlas, notes]), {});
    assert.deepEqual(shareWorkspaceBody("ws-2", "ws-9", [atlas, notes]), {});
  });

  it("keeps the four open modes and adds a separate workspace choice", () => {
    const modes = readFileSync(
      new URL("../components/share/share-mode-list.tsx", import.meta.url),
      "utf8",
    );
    const modeOption = readFileSync(
      new URL("../components/share/share-mode-option.tsx", import.meta.url),
      "utf8",
    );
    const modal = readFileSync(
      new URL("../components/share/share-modal.tsx", import.meta.url),
      "utf8",
    );
    const choice = readFileSync(
      new URL("../components/share/share-workspace-choice.tsx", import.meta.url),
      "utf8",
    );
    const option = readFileSync(
      new URL("../components/share/share-workspace-option.tsx", import.meta.url),
      "utf8",
    );
    assert.match(modes, /Only me/);
    assert.match(modes, /By email/);
    assert.match(modes, /By password/);
    assert.match(modes, /Public/);
    assert.equal(/workspace/i.test(modes), false);
    assert.match(modeOption, /name="share"/);
    assert.match(option, /name="share-workspace"/);
    assert.equal(option.includes('name="share"'), false);
    assert.match(modal, /<ShareModeList/);
    assert.match(modal, /<ShareWorkspaceChoice/);
    assert.match(modal, /shareWorkspaceBody/);
    assert.match(choice, /adminWorkspaces/);
    assert.match(choice, /if \(workspaces\.length === 0\) return null/);
    assert.match(choice, /onSelect\(null\)/);
  });

  it("places the document for an admin, applies the workspace limit, and clears back to personal", () => {
    const store = readFileSync(new URL("./documents.ts", import.meta.url), "utf8");
    const route = readFileSync(
      new URL("../app/api/documents/[id]/share/route.ts", import.meta.url),
      "utf8",
    );
    const admin = store.slice(
      store.indexOf("async function adminLibraryId"),
      store.indexOf("async function applyDocumentWorkspace"),
    );
    const apply = store.slice(
      store.indexOf("async function applyDocumentWorkspace"),
      store.indexOf("export async function updateShare"),
    );
    const update = store.slice(
      store.indexOf("export async function updateShare"),
      store.indexOf("async function upsertEmbedding"),
    );
    const create = store.slice(
      store.indexOf("export async function createDocument"),
      store.indexOf("export async function getOwnedDocument"),
    );
    assert.match(admin, /isWorkspaceAdmin/);
    assert.match(admin, /Only an admin can choose this workspace/);
    assert.match(apply, /adminLibraryId/);
    assert.match(apply, /workspaceId: null/);
    assert.match(apply, /placeDocumentInWorkspace/);
    assert.ok(apply.indexOf("adminLibraryId") < apply.indexOf("placeDocumentInWorkspace"));
    assert.ok(apply.indexOf("workspaceId: null") < apply.indexOf("placeDocumentInWorkspace"));
    assert.match(update, /input\.workspaceId === undefined/);
    assert.match(update, /applyDocumentWorkspace/);
    assert.match(update, /workspaceId,/);
    assert.match(route, /workspaceId: z\.string\(\)\.min\(1\)\.nullable\(\)\.optional\(\)/);
    assert.match(create, /workspaceId: null/);
    assert.equal(/applyDocumentWorkspace/.test(create), false);
  });

  it("leaves a new note or diagram unshared until the share dialog assigns a workspace", () => {
    const store = readFileSync(new URL("./documents.ts", import.meta.url), "utf8");
    const createRoute = readFileSync(
      new URL("../app/api/documents/route.ts", import.meta.url),
      "utf8",
    );
    const agentRoute = readFileSync(
      new URL("../app/api/agent/v1/documents/route.ts", import.meta.url),
      "utf8",
    );
    const libraryCreate = readFileSync(
      new URL("../components/library/library-create.tsx", import.meta.url),
      "utf8",
    );
    const board = readFileSync(
      new URL("../components/library/document-board.tsx", import.meta.url),
      "utf8",
    );
    const create = store.slice(
      store.indexOf("export async function createDocument"),
      store.indexOf("export async function getOwnedDocument"),
    );
    const insert = create.slice(create.indexOf(".values({"), create.indexOf(".returning()"));
    const apply = store.slice(
      store.indexOf("async function applyDocumentWorkspace"),
      store.indexOf("export async function updateShare"),
    );
    const update = store.slice(
      store.indexOf("export async function updateShare"),
      store.indexOf("async function upsertEmbedding"),
    );
    const createSchema = createRoute.slice(
      createRoute.indexOf("const createSchema"),
      createRoute.indexOf("export async function GET"),
    );
    const agentSchema = agentRoute.slice(
      agentRoute.indexOf("const createSchema"),
      agentRoute.indexOf("export async function POST"),
    );

    assert.match(
      store,
      /export async function createDocument\(ownerId: string, type: DocumentType, title\?: string\)/,
    );
    assert.match(insert, /workspaceId:\s*null\b/);
    assert.equal((insert.match(/workspaceId/g) ?? []).length, 1);
    assert.equal(create.includes("placeDocumentInWorkspace"), false);
    assert.equal(create.includes("applyDocumentWorkspace"), false);
    assert.equal(createSchema.includes("workspaceId"), false);
    assert.match(createRoute, /createDocument\(user\.id, input\.type, input\.title\)/);
    assert.equal(agentSchema.includes("workspaceId"), false);
    assert.match(agentRoute, /createDocument\(userId, input\.type, input\.title\)/);
    assert.equal(libraryCreate.includes("workspaceId"), false);
    assert.match(libraryCreate, /JSON\.stringify\(\{ type \}\)/);
    assert.match(board, /<LibraryCreate \/>/);
    assert.equal(/<LibraryCreate[^/]*workspace/i.test(board), false);
    assert.equal((store.match(/placeDocumentInWorkspace\(/g) ?? []).length, 2);
    assert.match(apply, /placeDocumentInWorkspace\(/);
    assert.equal((store.match(/applyDocumentWorkspace\(/g) ?? []).length, 2);
    assert.match(update, /applyDocumentWorkspace\(/);
  });

  it("keeps create routes and a later content write from placing the document", () => {
    const store = readFileSync(new URL("./documents.ts", import.meta.url), "utf8");
    const createRoute = readFileSync(
      new URL("../app/api/documents/route.ts", import.meta.url),
      "utf8",
    );
    const agentRoute = readFileSync(
      new URL("../app/api/agent/v1/documents/route.ts", import.meta.url),
      "utf8",
    );
    const write = store.slice(
      store.indexOf("export async function updateDocumentContent"),
      store.indexOf("export async function deleteDocument"),
    );
    const saved = write.slice(
      write.indexOf(".set({"),
      write.indexOf(".where(eq(documents.id, id))"),
    );

    assert.equal(createRoute.includes("workspaceId"), false);
    assert.equal(createRoute.includes("placeDocumentInWorkspace"), false);
    assert.equal(createRoute.includes("updateShare"), false);
    assert.equal(agentRoute.includes("workspaceId"), false);
    assert.equal(agentRoute.includes("placeDocumentInWorkspace"), false);
    assert.equal(agentRoute.includes("updateShare"), false);
    assert.equal(saved.includes("workspaceId"), false);
  });

  it("moves the open library card when the saved workspace changes", () => {
    const board = readFileSync(
      new URL("../components/library/document-board.tsx", import.meta.url),
      "utf8",
    );
    const menu = readFileSync(
      new URL("../components/library/document-menu.tsx", import.meta.url),
      "utf8",
    );
    const screen = readFileSync(
      new URL("../components/document-screen.tsx", import.meta.url),
      "utf8",
    );
    const page = readFileSync(new URL("../app/d/[id]/page.tsx", import.meta.url), "utf8");
    assert.match(board, /workspaceId: change\.workspaceId/);
    assert.match(menu, /workspaceId=\{item\.workspaceId\}/);
    assert.match(menu, /workspaceId: share\.workspaceId/);
    assert.match(screen, /workspaceId=\{shareState\.workspaceId\}/);
    assert.match(page, /workspaceId=\{bundle\.document\.workspaceId\}/);
  });
});
