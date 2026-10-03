import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const published = readFileSync(new URL("../../agent/SKILL.md", import.meta.url), "utf8");
const cursorSkill = readFileSync(
  new URL("../../.cursor/skills/pamiac/SKILL.md", import.meta.url),
  "utf8",
);
const apiKeys = readFileSync(
  new URL("../components/tokens/token-skill.ts", import.meta.url),
  "utf8",
);

const required = [
  "Read `PAMIAC_TOKEN` from the process environment (the agent environment)",
  "Authorization: Bearer <PAMIAC_TOKEN>",
  "Do not call the document HTTP API with curl, fetch, or the shell.",
  "Do not ask the user to paste the token.",
  "Do not print the token.",
  "Do not invent a token.",
  "Use that flow only when the pamiac MCP tools are not available.",
  "When you are Claude Code, stop here.",
  "claude mcp add --transport http pamiac https://pamiac.com/api/mcp",
  "Do not POST to google-login, do not call pamiac.com from the shell, do not save a token to a file, and do not bypass a safety check.",
  "If `PAMIAC_TOKEN` is missing, do not stop and do not ask for a pasted token.",
  "Offer sign-in with Google.",
  "Say this connects Cursor, Grok, Cloud, Codex, DeepSeek, and any other agent the same way.",
  "POST https://pamiac.com/api/agent/v1/google-login",
  "No `Authorization` header.",
  "verificationUrl",
  "/connect/google?user_code=<userCode>",
  "Do not ask for a Google password.",
  "GET https://pamiac.com/api/agent/v1/google-login?device_code=<deviceCode>",
  `{ "status": "pending" }`,
  `{ "status": "ready", "token": "pam_..." }`,
  `{ "status": "denied" }`,
  `{ "status": "expired" }`,
  "If the POST returns that Google sign-in is not configured, say so and stop.",
  "If the sandbox, proxy, or safety check refuses `https://pamiac.com` (including `host_not_allowed` or a data-exfiltration flag), stop.",
  "Tell the user this session must allow `https://pamiac.com`.",
  "Do not send that request through the browser, Chrome, a proxy, or another tool.",
  "Once a token exists (`PAMIAC_TOKEN` in the environment, or status `ready` from Google login), call the document HTTP API with `Authorization: Bearer` and that token.",
  "This HTTP API is only for a session where the pamiac MCP tools are not available.",
  "GET https://pamiac.com/api/agent/v1/workspaces",
  "POST https://pamiac.com/api/agent/v1/search",
  "GET https://pamiac.com/api/agent/v1/documents",
  "GET https://pamiac.com/api/agent/v1/documents/<id>",
  "POST https://pamiac.com/api/agent/v1/documents",
  "PATCH https://pamiac.com/api/agent/v1/documents/<id>",
  "Do not send nodes at the top level of the PATCH body.",
  '"patch": {',
  "App: https://pamiac.com",
  "search_documents",
  "list_workspaces",
  "list_documents",
  "read_document",
  "create_note",
  "create_diagram",
  "update_note",
  "update_diagram",
  "checkout payment classes",
  "Diagram relations can refer to an element by id or by name.",
  "`read_document` in the same turn",
  "only the nodes you change",
  "Omit other nodes.",
  "Creating a node without an id still slugs from the name",
  "Notes remain a full markdown `content` replace.",
];

test("published skill and /pamiac skill are the same contract", () => {
  assert.equal(cursorSkill, published);
});

test("skill reads PAMIAC_TOKEN and does not ask the user to paste it", () => {
  for (const line of required) {
    assert.equal(published.includes(line), true, line);
  }
  assert.equal(published.includes("Ask the user for a Pamiac token"), false);
  assert.equal(published.includes("Bearer pam_..."), false);
});

test("API keys page gives the agent the same token rule", () => {
  assert.equal(
    apiKeys.includes(
      "Read PAMIAC_TOKEN from the agent environment. The pamiac MCP server sends Authorization: Bearer <PAMIAC_TOKEN> when that variable is set. Do not print the token. Do not ask the user to paste the token. Do not invent a token.",
    ),
    true,
  );
  assert.equal(apiKeys.includes("list_workspaces"), true);
  assert.equal(apiKeys.includes("search_documents"), true);
  assert.equal(apiKeys.includes("Do not curl the document API."), true);
  assert.equal(apiKeys.includes("Bearer pam_..."), false);
});
