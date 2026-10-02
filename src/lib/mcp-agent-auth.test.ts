import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync(new URL("../app/api/mcp/route.ts", import.meta.url), "utf8");
const server = readFileSync(new URL("./mcp-server.ts", import.meta.url), "utf8");

test("POST /api/mcp accepts a pam_ bearer and still uses OAuth for other requests", () => {
  const database = route.indexOf("if (!process.env.DATABASE_URL)");
  const pam = route.indexOf('token.startsWith("pam_")');
  const agentAuth = route.indexOf("authenticateAgentToken(token)");
  const scoped = route.indexOf("scope: result.user.scope");
  const oauth = route.indexOf("await ensureLiveJwks()");
  const mcpAuth = route.indexOf("requireMcpAuth(");
  const handler = route.indexOf("createPamiacMcpServer(");

  assert.ok(database >= 0);
  assert.ok(pam > database);
  assert.ok(agentAuth > pam);
  assert.ok(scoped > agentAuth);
  assert.ok(oauth > scoped);
  assert.ok(mcpAuth > oauth);
  assert.match(
    route,
    /createPamiacMcpServer\(\s*mcpRequestUserId\(ctx\.authInfo\),\s*origin,\s*mcpRequestScope\(ctx\.authInfo\),\s*\)/,
  );
  assert.match(route, /scope: \{ allScopes: true, workspaceIds: \[\] \}/);
  assert.ok(handler >= 0);
  assert.equal(route.slice(pam, oauth).includes("requireMcpAuth"), false);
  assert.doesNotMatch(route, /console\.(log|info|debug|warn|error)/);
});

test("list and read tools use the agent scope helpers", () => {
  assert.match(server, /"list_workspaces"/);
  assert.match(server, /listAgentWorkspaces\(userId, scope\)/);
  assert.match(server, /listAgentDocuments\(userId, scope\)/);
  assert.match(server, /getAgentDocument\(userId, id, scope\)/);
  assert.doesNotMatch(server, /listDocuments\(userId\)/);
  assert.doesNotMatch(server, /getOwnedDocument\(/);
});

test("create and update pass scope as the last argument", () => {
  const createDiagram = server.slice(
    server.indexOf('"create_diagram"'),
    server.indexOf('"update_note"'),
  );
  const updateNote = server.slice(
    server.indexOf('"update_note"'),
    server.indexOf('"update_diagram"'),
  );
  const updateDiagram = server.slice(
    server.indexOf('"update_diagram"'),
    server.indexOf("for (const prompt"),
  );

  assert.match(createDiagram, /agentCreateWorkspace\(userId, scope\)/);
  assert.match(
    createDiagram,
    /updateDocumentContent\(\s*userId,\s*created\.id,[\s\S]*?,\s*scope,\s*\)/,
  );
  assert.match(
    updateNote,
    /updateDocumentContent\(\s*userId,\s*id,\s*\{[\s\S]*expectedVersion:\s*version,\s*\},\s*scope,\s*\)/,
  );
  assert.match(
    updateDiagram,
    /updateDocumentContent\(\s*userId,\s*id,\s*\{[\s\S]*expectedVersion:\s*version,\s*\},\s*scope,\s*\)/,
  );
});

test("a rejected pam_ bearer is a 401 and the raw token is not forwarded", () => {
  const pam = route.slice(
    route.indexOf('token.startsWith("pam_")'),
    route.indexOf("await ensureLiveJwks()"),
  );

  assert.match(route, /header\.startsWith\("Bearer "\)/);
  assert.match(pam, /result\.status !== "ok"/);
  assert.match(pam, /agentTokenError\(result\.status\)/);
  assert.match(pam, /status: 401/);
  assert.match(route, /status === "expired"\) return "Expired agent token"/);
  assert.match(route, /return "Invalid agent token"/);
  assert.match(pam, /token: ""/);
  assert.match(pam, /scope: result\.user\.scope/);
  assert.doesNotMatch(pam, /token: token/);
});

test("Cursor MCP config calls /api/mcp with the env token and does not embed a secret", () => {
  const config = readFileSync(new URL("../../.cursor/mcp.json", import.meta.url), "utf8");

  assert.match(config, /https:\/\/pamiac\.com\/api\/mcp/);
  assert.match(config, /Bearer \$\{env:PAMIAC_TOKEN\}/);
  assert.doesNotMatch(config, /pam_[A-Za-z0-9]/);
  assert.doesNotMatch(config, /\/api\/agent\/v1/);
});
