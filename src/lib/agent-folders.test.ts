import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { folderInAgentScope } from "./folder-library.ts";
import { PERSONAL_SPACE_ID } from "./library-spaces.ts";
import { presentListedDocument } from "./mcp-documents.ts";

test("folder scope keeps personal folders only when that space is selected", () => {
  const all = { allScopes: true, workspaceIds: [] };
  const personal = { allScopes: false, workspaceIds: [PERSONAL_SPACE_ID] };
  const team = { allScopes: false, workspaceIds: ["team"] };
  const both = { allScopes: false, workspaceIds: [PERSONAL_SPACE_ID, "team"] };

  assert.equal(folderInAgentScope(all, null), true);
  assert.equal(folderInAgentScope(all, "team"), true);
  assert.equal(folderInAgentScope(personal, null), true);
  assert.equal(folderInAgentScope(personal, "team"), false);
  assert.equal(folderInAgentScope(team, null), false);
  assert.equal(folderInAgentScope(team, "team"), true);
  assert.equal(folderInAgentScope(team, "other"), false);
  assert.equal(folderInAgentScope(both, null), true);
  assert.equal(folderInAgentScope(both, "team"), true);
  assert.equal(folderInAgentScope(both, "other"), false);
});

test("listed and readable documents keep folderId when the row has one", () => {
  const listed = presentListedDocument(
    {
      id: "doc-4",
      type: "note",
      title: "Inbox",
      updatedAt: new Date("2026-05-01T00:00:00.000Z"),
      folderId: "folder-1",
    },
    "https://pamiac.example",
  );
  assert.equal(listed.folderId, "folder-1");

  const documents = readFileSync(new URL("./documents.ts", import.meta.url), "utf8");
  const presenter = documents.slice(
    documents.indexOf("export function presentDocument"),
    documents.indexOf("export function presentDocumentWrite"),
  );
  assert.match(
    presenter,
    /"folderId" in document \? \{ folderId: document\.folderId \?\? null \} : \{\}/,
  );
});

test("agent folder tools and routes stay inside the connection scope", () => {
  const server = readFileSync(new URL("./mcp-server.ts", import.meta.url), "utf8");
  const folders = readFileSync(new URL("./folders.ts", import.meta.url), "utf8");
  const listRoute = readFileSync(
    new URL("../app/api/agent/v1/folders/route.ts", import.meta.url),
    "utf8",
  );
  const moveRoute = readFileSync(
    new URL("../app/api/agent/v1/folders/move/route.ts", import.meta.url),
    "utf8",
  );
  const sessionList = readFileSync(new URL("../app/api/folders/route.ts", import.meta.url), "utf8");
  const sessionMove = readFileSync(
    new URL("../app/api/folders/move/route.ts", import.meta.url),
    "utf8",
  );

  for (const name of ["list_folders", "create_folder", "move_document_to_folder", "move_folder"]) {
    assert.equal(server.includes(`"${name}"`), true, name);
  }
  assert.match(server, /listAgentFolders\(userId, scope\)/);
  assert.match(server, /createAgentFolder\(userId, scope, name, workspaceId, parentId \?\? null\)/);
  assert.match(server, /moveAgentDocumentToFolder\(userId, scope, id, folderId\)/);
  assert.match(server, /moveAgentFolder\(userId, scope, folderId, parentId\)/);
  assert.doesNotMatch(server, /listLibraryFolders\(/);
  assert.match(server, /annotations: readAnnotations/);
  assert.match(server, /annotations: createAnnotations/);

  assert.match(folders, /workspaceId \?\? \(await agentCreateWorkspace\(userId, scope\)\)/);
  assert.match(folders, /getAgentDocument\(userId, documentId, scope\)/);
  assert.match(folders, /folderMovesIntoItself\(family, folder\.id, parentId\)/);
  assert.match(folders, /A folder cannot move into itself/);

  assert.match(listRoute, /requireAgentUser\(request\)/);
  assert.match(listRoute, /listAgentFolders\(agent\.id, agent\.scope\)/);
  assert.match(listRoute, /createAgentFolder\(/);
  assert.match(listRoute, /corsHeaders\(\)/);
  assert.doesNotMatch(listRoute, /listLibraryFolders|requireLibraryUser/);

  assert.match(moveRoute, /z\.discriminatedUnion\("kind"/);
  assert.match(moveRoute, /kind: z\.literal\("document"\)/);
  assert.match(moveRoute, /kind: z\.literal\("folder"\)/);
  assert.match(moveRoute, /moveAgentDocumentToFolder\(/);
  assert.match(moveRoute, /moveAgentFolder\(/);
  assert.match(moveRoute, /requireAgentUser\(request\)/);
  assert.doesNotMatch(moveRoute, /moveDocumentToFolder\(|moveFolder\(/);

  assert.match(sessionList, /listLibraryFolders\(user\.id\)/);
  assert.match(sessionList, /createFolder\(/);
  assert.match(sessionMove, /moveDocumentToFolder\(user\.id, input\.documentId, input\.folderId\)/);
  assert.match(sessionMove, /moveFolder\(user\.id, input\.folderId, input\.parentId\)/);
  assert.doesNotMatch(sessionList + sessionMove, /AgentScope|requireAgentUser/);
});

test("folder tools are named in the agent skill and the token skill", () => {
  const published = readFileSync(new URL("../../agent/SKILL.md", import.meta.url), "utf8");
  const cursorSkill = readFileSync(
    new URL("../../.cursor/skills/pamiac/SKILL.md", import.meta.url),
    "utf8",
  );
  const chatgpt = readFileSync(new URL("../../skills/pamiac/SKILL.md", import.meta.url), "utf8");
  const token = readFileSync(
    new URL("../components/tokens/token-skill.ts", import.meta.url),
    "utf8",
  );
  const names = ["list_folders", "create_folder", "move_document_to_folder", "move_folder"];

  assert.equal(cursorSkill, published);
  for (const name of names) {
    assert.equal(published.includes(name), true, name);
    assert.equal(chatgpt.includes(name), true, name);
    assert.equal(token.includes(name), true, name);
  }
  assert.match(published, /GET https:\/\/pamiac\.com\/api\/agent\/v1\/folders/);
  assert.match(published, /POST https:\/\/pamiac\.com\/api\/agent\/v1\/folders\/move/);
  assert.match(token, /GET https:\/\/pamiac\.com\/api\/agent\/v1\/folders/);
  assert.match(token, /POST https:\/\/pamiac\.com\/api\/agent\/v1\/folders\/move/);
  assert.equal(chatgpt.includes("/api/agent"), false);
  assert.equal(chatgpt.includes("PAMIAC_TOKEN"), false);
});
