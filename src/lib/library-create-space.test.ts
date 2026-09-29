import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function read(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("create in the open library", () => {
  it("stores personal as null and a member workspace under that workspace id", () => {
    const store = read("./documents.ts");
    const create = store.slice(
      store.indexOf("export async function createDocument"),
      store.indexOf("export async function getOwnedDocument"),
    );
    const workspaceRoom = create.slice(
      create.indexOf("if (libraryId)"),
      create.indexOf("} else {"),
    );
    const personalRoom = create.slice(
      create.indexOf("} else {"),
      create.indexOf("const id = crypto"),
    );

    assert.match(create, /!workspaceId \|\| workspaceId === PERSONAL_SPACE_ID/);
    assert.ok(create.indexOf("PERSONAL_SPACE_ID") < create.indexOf("memberLibraryId"));
    assert.match(create, /memberLibraryId\(ownerId, workspaceId\)/);
    assert.equal(/adminLibraryId|isWorkspaceAdmin/.test(create), false);
    assert.match(workspaceRoom, /eq\(documents\.workspaceId, libraryId\)/);
    assert.equal(/ownerId/.test(workspaceRoom), false);
    assert.match(workspaceRoom, /currentWorkspacePlan\(\)/);
    assert.equal(/currentPlan\(\)/.test(workspaceRoom), false);
    assert.match(personalRoom, /documentRoom\(personal\.length, currentPlan\(\)\)/);
    assert.equal(/currentWorkspacePlan\(\)/.test(personalRoom), false);
    assert.match(create, /workspaceId: libraryId \?\? null/);
  });

  it("threads the open space into the create buttons and shows the API error", () => {
    const board = read("../components/library/document-board.tsx");
    const header = read("../components/library/library-header.tsx");
    const create = read("../components/library/library-create.tsx");

    assert.match(board, /<LibraryHeader[\s\S]*selectedId=\{workspaceId\}/);
    assert.match(header, /<LibraryCreate workspaceId=\{selectedId\} \/>/);
    assert.match(create, /JSON\.stringify\(\{ type, workspaceId \}\)/);
    assert.match(create, /body\?\.error \?\? "Could not create the document"/);
    assert.match(create, /<p className="error">\{message\}<\/p>/);
    assert.match(create, /router\.push\(`\/d\/\$\{id\}`\)/);
    assert.match(create, /mutation\.isPending/);
    assert.equal(/useState/.test(create), false);
  });

  it("leaves agent and MCP creates on the personal library", () => {
    const agent = read("../app/api/agent/v1/documents/route.ts");
    const mcp = read("./mcp-server.ts");

    assert.match(agent, /createDocument\(userId, input\.type, input\.title\)/);
    assert.equal(/workspaceId/.test(agent), false);
    assert.match(mcp, /createDocument\(userId, "note", title\)/);
    assert.match(mcp, /createDocument\(userId, "diagram", title\)/);
    assert.equal(/createDocument\([^)]*workspaceId/.test(mcp), false);
  });
});
