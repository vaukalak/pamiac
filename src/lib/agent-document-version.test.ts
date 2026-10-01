import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { agentDocumentUpdateSchema, documentUpdateSchema } from "./document-write.ts";
import { errorResponse, HttpError } from "./http.ts";

describe("agent document version", () => {
  it("requires a positive integer version on the agent schema", () => {
    assert.equal(agentDocumentUpdateSchema.safeParse({ content: "note" }).success, false);
    assert.equal(
      agentDocumentUpdateSchema.safeParse({ version: 0, content: "note" }).success,
      false,
    );
    assert.equal(
      agentDocumentUpdateSchema.safeParse({ version: 1.5, content: "note" }).success,
      false,
    );
    assert.equal(
      agentDocumentUpdateSchema.safeParse({ version: "3", content: "note" }).success,
      false,
    );
    assert.equal(
      agentDocumentUpdateSchema.safeParse({ version: 3, content: "note" }).success,
      true,
    );
  });

  it("keeps a missing version valid for human last-write-wins saves", () => {
    assert.equal(documentUpdateSchema.safeParse({ content: "note" }).success, true);
    assert.equal(documentUpdateSchema.safeParse({ content: "note", version: 2 }).success, true);
  });

  it("attaches version, title, and content only on the conflict error", async () => {
    const conflict = errorResponse(
      new HttpError(409, "Document changed. Read it again and send the current version.", {
        version: 4,
        title: "Note",
        content: "hello",
      }),
      true,
    );
    assert.equal(conflict.status, 409);
    assert.deepEqual(await conflict.json(), {
      error: "Document changed. Read it again and send the current version.",
      version: 4,
      title: "Note",
      content: "hello",
    });

    const humanConflict = errorResponse(
      new HttpError(409, "Document changed. Read it again and send the current version.", {
        version: 5,
        title: "Map",
        content: { nodes: [], relations: [] },
      }),
    );
    assert.deepEqual(await humanConflict.json(), {
      error: "Document changed. Read it again and send the current version.",
      version: 5,
      title: "Map",
      content: { nodes: [], relations: [] },
    });

    const missing = errorResponse(new HttpError(404, "Document not found"), true);
    assert.deepEqual(await missing.json(), { error: "Document not found" });

    const human = errorResponse(new HttpError(400, "Title is too long"));
    assert.deepEqual(await human.json(), { error: "Title is too long" });
  });

  it("checks the locked row before writing and leaves creates unchecked", () => {
    const store = readFileSync(new URL("./documents.ts", import.meta.url), "utf8");
    const update = store.slice(store.indexOf("export async function updateDocumentContent"));
    const check = update.indexOf("documentVersionConflict(current.version, input.expectedVersion)");
    const write = update.indexOf("applyDocumentWrite(");
    assert.ok(check > 0);
    assert.ok(write > check);
    assert.match(
      update,
      /new HttpError\(\s*409,\s*DOCUMENT_VERSION_CONFLICT,\s*presentDocumentWrite\(/,
    );

    const human = readFileSync(
      new URL("../app/api/documents/[id]/route.ts", import.meta.url),
      "utf8",
    );
    assert.match(human, /updateDocumentContent\(user\.id, id, \{\s*title: input\.title,/);
    assert.match(human, /expectedVersion: input\.version/);

    const create = readFileSync(
      new URL("../app/api/agent/v1/documents/route.ts", import.meta.url),
      "utf8",
    );
    assert.match(
      create,
      /updateDocumentContent\(\s*agent\.id,\s*created\.id,\s*\{\s*content: input\.content\s*\},/,
    );
    assert.equal(create.includes("expectedVersion"), false);

    const mcp = readFileSync(new URL("./mcp-server.ts", import.meta.url), "utf8");
    const noteSchema = mcp.slice(
      mcp.indexOf("const updateNoteInput"),
      mcp.indexOf("const updateDiagramInput"),
    );
    const diagramSchema = mcp.slice(
      mcp.indexOf("const updateDiagramInput"),
      mcp.indexOf("function textResult"),
    );
    const note = mcp.slice(mcp.indexOf('"update_note"'), mcp.indexOf('"update_diagram"'));
    const diagram = mcp.slice(mcp.indexOf('"update_diagram"'));
    const creates = mcp.slice(mcp.indexOf('"create_note"'), mcp.indexOf('"update_note"'));
    assert.match(note, /expectedVersion: version/);
    assert.match(diagram, /expectedVersion: version/);
    assert.match(noteSchema, /version: documentVersion/);
    assert.match(diagramSchema, /version: documentVersion/);
    assert.equal(creates.includes("expectedVersion"), false);
    const failure = mcp.slice(
      mcp.indexOf("function failureMessage"),
      mcp.indexOf("async function loadUser"),
    );
    assert.match(failure, /if \(error\.version === undefined\) return error\.message/);
    assert.match(failure, /version: error\.version/);
    assert.match(failure, /title: error\.title/);
    assert.match(failure, /content: error\.content/);

    const index = readFileSync(new URL("../app/api/agent/v1/route.ts", import.meta.url), "utf8");
    assert.equal(index.includes("optional. The server merges even when this is behind."), false);
    assert.match(index, /required\. The version from GET/);
    assert.match(index, /409/);
  });

  it("tells both agent skills to retry a conflict from a fresh read", () => {
    const published = readFileSync(new URL("../../agent/SKILL.md", import.meta.url), "utf8");
    const cursorSkill = readFileSync(
      new URL("../../.cursor/skills/pamiac/SKILL.md", import.meta.url),
      "utf8",
    );
    const mcp = readFileSync(new URL("../../skills/pamiac/SKILL.md", import.meta.url), "utf8");
    assert.equal(cursorSkill, published);
    assert.match(published, /"version": 3/);
    assert.match(published, /"version": 4/);
    assert.match(
      published,
      /On 409, the response includes the current `version`, `title`, and `content`/,
    );
    assert.match(published, /Rebuild a diagram `patch` against the new document/);
    assert.match(mcp, /Send `version` from `read_document`/);
    assert.match(mcp, /rebuild the change against that document/);
  });
});
