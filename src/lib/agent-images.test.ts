import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("upload_image stores a note image inside the connection scope", () => {
  const server = readFileSync(new URL("./mcp-server.ts", import.meta.url), "utf8");
  const store = readFileSync(new URL("./note-image.ts", import.meta.url), "utf8");
  const route = readFileSync(
    new URL("../app/api/agent/v1/documents/[id]/images/route.ts", import.meta.url),
    "utf8",
  );
  const browser = readFileSync(
    new URL("../app/api/documents/[id]/images/route.ts", import.meta.url),
    "utf8",
  );
  const tool = server.slice(server.indexOf('"upload_image"'), server.indexOf('"create_folder"'));

  assert.equal(server.includes('"upload_image"'), true);
  assert.match(tool, /annotations: createAnnotations/);
  assert.match(tool, /decodeImageBase64\(data\)/);
  assert.match(tool, /mediaType \?\? ""/);
  assert.match(
    tool,
    /uploadAgentNoteImage\(\s*userId,\s*id,\s*\{ bytes: decodeImageBase64\(data\), type: mediaType \?\? "" \},\s*scope,\s*\)/,
  );
  assert.match(store, /getAgentDocument\(userId, documentId, scope\)/);
  assert.match(store, /if \(!document\) throw new HttpError\(404, "Document not found"\)/);
  assert.match(store, /document\.type !== "note"/);
  assert.match(store, /Images belong on notes\./);
  assert.match(store, /requireLibraryUser/);
  assert.match(store, /getEditableDocument/);
  assert.match(route, /export function OPTIONS/);
  assert.match(route, /corsHeaders\(\)/);
  assert.match(route, /requireAgentUser\(request\)/);
  assert.match(route, /uploadAgentNoteImage\(/);
  assert.match(route, /agent\.scope/);
  assert.match(route, /decodeImageBase64\(input\.data\)/);
  assert.match(route, /input\.mediaType \?\? ""/);
  assert.match(route, /agentJson\(\{ url: uploaded\.url \}\)/);
  assert.match(route, /errorResponse\(error, true\)/);
  assert.doesNotMatch(route, /requireLibraryUser|getEditableDocument|uploadNoteImage/);
  assert.match(browser, /uploadNoteImage/);
  assert.doesNotMatch(browser, /requireAgentUser|uploadAgentNoteImage|AgentScope/);
  assert.doesNotMatch(tool, /updateDocumentContent/);
  assert.match(tool, /!\[description\]\(url\)/);
  assert.match(tool, /version from read_document/);
  assert.doesNotMatch(
    store.slice(
      store.indexOf("export async function uploadNoteImage"),
      store.indexOf("export async function uploadAgentNoteImage"),
    ),
    /document\.type !== "note"/,
  );
  assert.match(store, /return storeNoteImage\(user\.id, document\.id, file\)/);
  assert.match(store, /return storeNoteImage\(userId, document\.id, file\)/);
});

test("skills tell the agent to upload an image and then update the note", () => {
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
  const instructions = readFileSync(new URL("./mcp-instructions.ts", import.meta.url), "utf8");

  assert.equal(cursorSkill, published);
  for (const skill of [published, chatgpt, token]) {
    assert.equal(skill.includes("upload_image"), true);
    assert.match(skill, /JPEG, PNG, WebP, or GIF/);
    assert.match(skill, /!\[description\]\(url\)/);
    assert.match(skill, /update_note/);
  }
  assert.match(published, /POST https:\/\/pamiac\.com\/api\/agent\/v1\/documents\/<id>\/images/);
  assert.match(published, /"data": "<base64>"/);
  assert.match(token, /POST https:\/\/pamiac\.com\/api\/agent\/v1\/documents\/<id>\/images/);
  assert.match(token, /"data": "<base64>"/);
  assert.equal(chatgpt.includes("/api/agent"), false);
  assert.match(instructions, /upload_image stores a JPEG, PNG, WebP, or GIF and returns url/);
});
