import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function slice(source: string, start: string, end?: string) {
  const from = source.indexOf(start);
  assert.ok(from >= 0, start);
  if (!end) return source.slice(from);
  const to = source.indexOf(end, from + start.length);
  assert.ok(to > from, end);
  return source.slice(from, to);
}

describe("agent documents in the token workspace", () => {
  it("lists and reads only the workspace the token is bound to", () => {
    const store = readFileSync(new URL("./documents.ts", import.meta.url), "utf8");
    const owned = slice(
      store,
      "export async function listDocuments",
      "function agentDocumentWhere",
    );
    const where = slice(
      store,
      "function agentDocumentWhere",
      "export async function listAgentDocuments",
    );
    const list = slice(
      store,
      "export async function listAgentDocuments",
      "export async function listLibraryDocuments",
    );
    const read = slice(
      store,
      "export async function getAgentDocument",
      "export async function isDocumentWorkspaceMember",
    );
    const library = slice(
      store,
      "export async function listLibraryDocuments",
      "function createdLibraryId",
    );

    assert.match(owned, /eq\(documents\.ownerId, ownerId\)/);
    assert.equal(
      /workspaceMembers|agentDocumentWhere|isNull\(documents\.workspaceId\)/.test(owned),
      false,
    );
    assert.match(where, /if \(scope\.allScopes\) return accountDocumentWhere\(userId\)/);
    assert.match(
      where,
      /and\(eq\(documents\.ownerId, userId\), isNull\(documents\.workspaceId\)\)/,
    );
    assert.match(where, /exists\(/);
    assert.match(where, /eq\(workspaceMembers\.workspaceId, documents\.workspaceId\)/);
    assert.match(where, /inArray\(documents\.workspaceId, selected\)/);
    assert.match(where, /eq\(workspaceMembers\.userId, userId\)/);
    assert.equal(/\brole\b|isWorkspaceAdmin|visibility|updateShare/.test(where), false);
    assert.match(list, /where\(agentDocumentWhere\(userId, scope\)\)/);
    assert.equal(/eq\(documents\.ownerId/.test(list), false);
    assert.match(read, /agentDocumentWhere\(userId, scope\)/);
    assert.equal(/eq\(documents\.ownerId|visibility/.test(read), false);
    assert.match(library, /listDocuments\(ownerId\)/);
    assert.equal(/listAgentDocuments|agentDocumentWhere/.test(library), false);
  });

  it("searches the bound workspace and leaves a former member with nothing", () => {
    const store = readFileSync(new URL("./documents.ts", import.meta.url), "utf8");
    const search = slice(
      store,
      "export async function searchDocuments",
      "export async function searchAccountDocuments",
    );
    const visible = slice(
      store,
      "async function searchVisibleDocuments",
      "export async function searchDocuments",
    );
    const where = slice(
      store,
      "function agentDocumentWhere",
      "export async function listAgentDocuments",
    );

    assert.match(
      search,
      /if \(scope\.allScopes\) return searchAccountDocuments\(userId, query, limit\)/,
    );
    assert.match(search, /agentDocumentWhere\(userId, scope\)/);
    assert.match(visible, /\.where\(visible\)/);
    assert.match(visible, /and\(\s*visible,/);
    assert.equal(/eq\(documents\.ownerId/.test(search), false);
    assert.match(where, /isNull\(documents\.workspaceId\)/);
    assert.match(where, /exists\(/);
    assert.match(where, /inArray\(documents\.workspaceId, selected\)/);
    assert.equal(/workspaceInvites/.test(where), false);
  });

  it("updates workspace content for a member and still creates a personal document", () => {
    const listRoute = readFileSync(
      new URL("../app/api/agent/v1/documents/route.ts", import.meta.url),
      "utf8",
    );
    const idRoute = readFileSync(
      new URL("../app/api/agent/v1/documents/[id]/route.ts", import.meta.url),
      "utf8",
    );
    const searchRoute = readFileSync(
      new URL("../app/api/agent/v1/search/route.ts", import.meta.url),
      "utf8",
    );
    const humanList = readFileSync(
      new URL("../app/api/documents/route.ts", import.meta.url),
      "utf8",
    );
    const humanId = readFileSync(
      new URL("../app/api/documents/[id]/route.ts", import.meta.url),
      "utf8",
    );
    const patch = slice(idRoute, "export async function PATCH");
    const create = slice(listRoute, "const createSchema", "export async function POST");

    assert.match(listRoute, /listAgentDocuments\(agent\.id, agent\.scope\)/);
    assert.equal(/listDocuments\(/.test(listRoute), false);
    assert.equal(create.includes("workspaceId"), false);
    assert.match(listRoute, /agentCreateWorkspace\(agent\.id, agent\.scope\)/);
    assert.match(
      listRoute,
      /createDocument\(\s*agent\.id,\s*input\.type,\s*input\.title,\s*workspaceId\s*\)/,
    );
    assert.match(idRoute, /getAgentDocument\(agent\.id, id, agent\.scope\)/);
    assert.equal(/getOwnedDocument|updateShare|visibility|input\.workspaceId/.test(idRoute), false);
    assert.match(
      patch,
      /if \(!current\) return agentJson\(\{ error: "Document not found" \}, 404\)/,
    );
    assert.ok(patch.indexOf("getAgentDocument") < patch.indexOf("updateDocumentContent"));
    assert.match(
      patch,
      /updateDocumentContent\(\s*agent\.id,\s*id,\s*\{\s*title: input\.title,\s*content: input\.content,\s*patch: input\.patch,\s*\},\s*agent\.scope,\s*\)/,
    );
    assert.match(searchRoute, /agent\.scope\.allScopes/);
    assert.match(
      searchRoute,
      /searchDocuments\(agent\.id, input\.query, input\.limit \?\? 8, agent\.scope\)/,
    );
    assert.equal(/listAgentDocuments|getAgentDocument/.test(humanList), false);
    assert.match(humanId, /getEditableDocument\(user\.id, id\)/);
    assert.equal(/getAgentDocument/.test(humanId), false);
  });

  it("tells the agent skill that search reaches the bound workspace", () => {
    const published = readFileSync(new URL("../../agent/SKILL.md", import.meta.url), "utf8");
    const cursorSkill = readFileSync(
      new URL("../../.cursor/skills/pamiac/SKILL.md", import.meta.url),
      "utf8",
    );
    const sentence =
      "Search reaches the workspace this token was bound to, and a personal binding reaches only that user's personal documents.";

    assert.equal(cursorSkill, published);
    assert.equal(published.includes(sentence), true);
    assert.equal(published.includes("Search uses this user's document embeddings."), false);
    assert.equal(
      published.includes(
        "Search uses embeddings for this user's personal documents and the documents in workspaces where this user is a member.",
      ),
      false,
    );
    assert.equal(published.includes("PAMIAC_TOKEN"), true);
  });
});
