import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { resolveAccess } from "./access.ts";
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
    const setAt = write.indexOf(".set({");
    const saved = write.slice(setAt, write.indexOf(".where(eq(documents.id, id))", setAt));

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

  it("keeps one workspace beside link visibility and still opens the link for a non-member", () => {
    const schema = readFileSync(new URL("../db/schema.ts", import.meta.url), "utf8");
    const store = readFileSync(new URL("./documents.ts", import.meta.url), "utf8");
    const access = readFileSync(new URL("./access.ts", import.meta.url), "utf8");
    const page = readFileSync(new URL("../app/d/[id]/page.tsx", import.meta.url), "utf8");
    const route = readFileSync(
      new URL("../app/api/documents/[id]/share/route.ts", import.meta.url),
      "utf8",
    );
    const modal = readFileSync(
      new URL("../components/share/share-modal.tsx", import.meta.url),
      "utf8",
    );
    const documentTable = schema.slice(
      schema.indexOf("export const documents"),
      schema.indexOf("export const documentShares"),
    );
    const bundle = store.slice(
      store.indexOf("export async function getDocumentBundle"),
      store.indexOf("export async function updateDocumentContent"),
    );
    const place = store.slice(
      store.indexOf("export async function placeDocumentInWorkspace"),
      store.indexOf("export async function listSpaceDocuments"),
    );
    const apply = store.slice(
      store.indexOf("async function applyDocumentWorkspace"),
      store.indexOf("export async function updateShare"),
    );
    const update = store.slice(
      store.indexOf("export async function updateShare"),
      store.indexOf("async function upsertEmbedding"),
    );
    const resolve = access.slice(
      access.indexOf("export function resolveAccess"),
      access.indexOf("const EMAIL"),
    );
    const decision = page.slice(page.indexOf("resolveAccess({"), page.indexOf("if (access.level"));
    const visibilityWrite = update.slice(
      update.indexOf(".set({"),
      update.indexOf(".where(eq(documents.id, id))"),
    );
    const saveStart = modal.indexOf("async function save");
    const save = modal.slice(saveStart, modal.indexOf("return (", saveStart));
    const stranger = {
      isOwner: false,
      viewerEmail: null as string | null,
      allowedEmails: [] as string[],
      passwordOk: false,
    };

    assert.equal((documentTable.match(/workspaceId:/g) ?? []).length, 1);
    assert.equal(/workspaceIds/.test(documentTable), false);
    assert.equal(/workspaceId:[^,\n]*notNull/.test(documentTable), false);
    assert.match(place, /\.set\(\{ workspaceId: libraryId \}\)/);
    assert.equal(place.includes("workspaceIds"), false);
    assert.match(visibilityWrite, /visibility: input\.visibility/);
    assert.equal(visibilityWrite.includes("workspaceId"), false);
    assert.equal(update.includes("workspaceId: null"), false);
    assert.match(update, /input\.workspaceId === undefined[\s\S]*current\.workspaceId/);
    assert.equal(apply.includes("visibility"), false);
    assert.match(apply, /workspaceId: null/);
    assert.match(route, /visibility: z\.enum\(VISIBILITIES\)/);
    assert.match(route, /workspaceId: z\.string\(\)\.min\(1\)\.nullable\(\)\.optional\(\)/);
    assert.equal(route.includes("workspaceIds"), false);
    assert.equal(/workspace|member/i.test(bundle), false);
    assert.match(decision, /workspaceMember/);
    assert.match(page, /isDocumentWorkspaceMember\(user\.id, bundle\.document\.workspaceId\)/);
    assert.match(page, /if \(access\.level === "none"\) notFound\(\)/);
    assert.match(page, /canEdit=\{access\.level === "edit"\}/);
    assert.match(page, /isOwner=\{access\.level === "edit" && access\.reason === "owner"\}/);
    assert.match(page, /workspaceId=\{bundle\.document\.workspaceId\}/);
    assert.equal((resolve.match(/level: "edit"/g) ?? []).length, 2);
    assert.match(resolve, /if \(input\.isOwner\) return \{ level: "edit", reason: "owner" \}/);
    assert.match(
      resolve,
      /if \(input\.workspaceMember\) return \{ level: "edit", reason: "member" \}/,
    );
    assert.match(modal, /<ShareModeList mode=\{mode\} onChange=\{setMode\} \/>/);
    assert.match(
      modal,
      /<ShareWorkspaceChoice onSelect=\{setWorkspaceChoice\} selectedId=\{workspaceChoice\} \/>/,
    );
    assert.match(save, /visibility: mode/);
    assert.match(save, /shareWorkspaceBody\(workspaceId, workspaceChoice/);
    assert.equal(save.includes("workspaceId: null"), false);
    assert.equal(resolveAccess({ ...stranger, visibility: "public" }).level, "view");
    assert.equal(
      resolveAccess({ ...stranger, visibility: "password", passwordOk: true }).level,
      "view",
    );
    assert.equal(resolveAccess({ ...stranger, visibility: "password" }).level, "locked");
    assert.equal(
      resolveAccess({
        ...stranger,
        visibility: "emails",
        allowedEmails: ["ada@example.com"],
      }).reason,
      "login",
    );
    assert.equal(
      resolveAccess({
        ...stranger,
        visibility: "emails",
        allowedEmails: ["ada@example.com"],
        viewerEmail: "ada@example.com",
      }).level,
      "view",
    );
    assert.equal(
      resolveAccess({
        ...stranger,
        visibility: "emails",
        allowedEmails: ["ada@example.com"],
        viewerEmail: "other@example.com",
      }).level,
      "locked",
    );
    assert.equal(resolveAccess({ ...stranger, visibility: "private" }).level, "none");
    assert.equal(
      resolveAccess({ ...stranger, visibility: "private", workspaceMember: true }).reason,
      "member",
    );
    assert.equal(
      resolveAccess({ ...stranger, visibility: "private", workspaceMember: false }).level,
      "none",
    );
    assert.equal(
      resolveAccess({ ...stranger, isOwner: true, visibility: "private" }).level,
      "edit",
    );
    assert.equal(
      resolveAccess({
        ...stranger,
        isOwner: true,
        visibility: "private",
        workspaceMember: true,
      }).reason,
      "owner",
    );
    assert.equal(resolveAccess({ ...stranger, isOwner: true, visibility: "public" }).level, "edit");
  });

  it("keeps visibility writes off the workspace column and workspace writes off visibility", () => {
    const store = readFileSync(new URL("./documents.ts", import.meta.url), "utf8");
    const update = store.slice(
      store.indexOf("export async function updateShare"),
      store.indexOf("async function upsertEmbedding"),
    );
    const body = update.slice(update.indexOf("const current"));
    const shareFields = body.slice(0, body.indexOf("const workspaceId"));
    const workspaceAssign = body.slice(
      body.indexOf("const workspaceId"),
      body.indexOf("const db = getDb()"),
    );

    assert.match(shareFields, /input\.visibility === "emails"/);
    assert.match(shareFields, /input\.visibility === "password"/);
    assert.equal(shareFields.includes("workspaceId"), false);
    assert.equal(workspaceAssign.includes("visibility"), false);
    assert.match(workspaceAssign, /input\.workspaceId === undefined/);
    assert.match(workspaceAssign, /current\.workspaceId/);
    assert.match(workspaceAssign, /applyDocumentWorkspace\(/);
  });
});
