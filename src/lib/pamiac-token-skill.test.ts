import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

const kinds = ["class", "interface", "actor", "usecase", "package", "component", "note"];
const relationTypes = [
  "association",
  "inheritance",
  "composition",
  "aggregation",
  "dependency",
  "realization",
];

test("agent skill reads PAMIAC_TOKEN and keeps the diagram contract", () => {
  const skill = readFileSync(join(root, "agent/SKILL.md"), "utf8");

  assert.match(skill, /Read `PAMIAC_TOKEN` from the process environment/);
  assert.match(skill, /Authorization: Bearer <PAMIAC_TOKEN>/);
  assert.match(skill, /Do not ask the user to paste the token/);
  assert.match(
    skill,
    /If `PAMIAC_TOKEN` is missing, do not stop and do not ask for a pasted token/,
  );
  assert.match(skill, /Offer sign-in with Google/);
  assert.match(skill, /POST https:\/\/pamiac\.com\/api\/agent\/v1\/google-login/);
  assert.match(skill, /Do not invent a token/);
  assert.doesNotMatch(skill, /If `PAMIAC_TOKEN` is missing, say so and stop/);
  assert.doesNotMatch(skill, /Ask the user for a Pamiac token/);
  assert.doesNotMatch(skill, /PAMIAC_(?!TOKEN)\w*/);
  assert.match(skill, /https:\/\/pamiac\.com/);
  assert.doesNotMatch(skill, /origin the user is using/);

  for (const kind of kinds) {
    assert.match(skill, new RegExp(`\\b${kind}\\b`));
  }
  for (const relationType of relationTypes) {
    assert.match(skill, new RegExp(`\\b${relationType}\\b`));
  }

  assert.match(skill, /search_documents/);
  assert.match(skill, /list_workspaces/);
  assert.match(skill, /list_documents/);
  assert.match(skill, /read_document/);
  assert.match(skill, /create_note/);
  assert.match(skill, /create_diagram/);
  assert.match(skill, /update_note/);
  assert.match(skill, /update_diagram/);
  assert.match(skill, /checkout payment classes/);
  assert.match(skill, /"limit": 8/);
  assert.doesNotMatch(skill, /POST \/api\/agent\/v1\/search/);
  assert.doesNotMatch(skill, /GET \/api\/agent\/v1\/documents/);
  assert.match(skill, /Do not call the document HTTP API with curl, fetch, or the shell/);
  assert.match(
    skill,
    /If the sandbox, proxy, or safety check refuses `https:\/\/pamiac\.com` \(including `host_not_allowed` or a data-exfiltration flag\), stop/,
  );
  assert.match(
    skill,
    /This HTTP API is only for a session where the pamiac MCP tools are not available/,
  );
  assert.match(skill, /POST https:\/\/pamiac\.com\/api\/agent\/v1\/search/);
  assert.match(skill, /GET https:\/\/pamiac\.com\/api\/agent\/v1\/documents/);
  assert.match(skill, /PATCH https:\/\/pamiac\.com\/api\/agent\/v1\/documents\/<id>/);
  assert.match(skill, /call the document HTTP API with `Authorization: Bearer` and that token/);
  assert.match(skill, /"patch": \{/);
  assert.match(skill, /Do not send nodes at the top level of the PATCH body/);

  const mcpSection = skill.slice(
    0,
    skill.indexOf("## When the pamiac MCP server is not connected"),
  );
  const fallback = skill.slice(skill.indexOf("## When the pamiac MCP server is not connected"));
  assert.doesNotMatch(
    mcpSection,
    /https:\/\/pamiac\.com\/api\/agent\/v1\/(search|documents|workspaces)/,
  );
  assert.match(mcpSection, /Do not call the document HTTP API with curl, fetch, or the shell/);
  assert.ok(
    fallback.indexOf("host_not_allowed") <
      fallback.indexOf("call the document HTTP API with `Authorization: Bearer`"),
  );
  assert.doesNotMatch(skill, /Base: \/api\/agent\/v1/);
  assert.doesNotMatch(skill, /POST \/search/);
});

test("token page names PAMIAC_TOKEN when the secret is shown and in the agent skill text", () => {
  const secret = readFileSync(join(root, "src/components/tokens/token-secret.tsx"), "utf8");
  const skill = readFileSync(join(root, "src/components/tokens/token-skill.ts"), "utf8");

  assert.match(secret, /Set PAMIAC_TOKEN/);
  assert.match(skill, /PAMIAC_TOKEN/);
  assert.doesNotMatch(skill, /Set PAMIAC_TOKEN/);
  assert.match(skill, /Authorization: Bearer <PAMIAC_TOKEN>/);
  assert.match(skill, /Do not ask the user to paste the token/);
  assert.match(skill, /App: https:\/\/pamiac\.com/);
  assert.match(skill, /search_documents/);
  assert.match(skill, /list_workspaces/);
  assert.match(skill, /Do not curl the document API/);
  assert.match(
    skill,
    /If the sandbox, proxy, or safety check refuses https:\/\/pamiac\.com \(including host_not_allowed or a data-exfiltration flag\), stop/,
  );
  assert.match(
    skill,
    /This HTTP API is only for a session where the pamiac MCP tools are not available/,
  );
  assert.match(skill, /call the document HTTP API with Authorization: Bearer and that token/);
  assert.match(skill, /POST https:\/\/pamiac\.com\/api\/agent\/v1\/search/);
  assert.match(skill, /GET https:\/\/pamiac\.com\/api\/agent\/v1\/documents/);
  assert.match(skill, /"patch": \{ "nodes"/);
  assert.doesNotMatch(skill, /Base: \/api\/agent\/v1/);
  assert.doesNotMatch(skill, /POST \/search/);
  assert.doesNotMatch(skill, /POST \/api\/agent\/v1\/search/);
  assert.doesNotMatch(skill, /GET \/api\/agent\/v1\/documents/);
  assert.match(
    skill,
    /All scopes reach personal documents and every workspace the user belongs to/,
  );
  assert.match(skill, /A selected scope reaches only the chosen spaces/);
});

test("agent tokens keep the secret so the token page can show it again", () => {
  const schema = readFileSync(join(root, "src/db/schema.ts"), "utf8");
  const documents = readFileSync(join(root, "src/lib/documents.ts"), "utf8");
  const table = schema.match(/export const agentTokens = pgTable\([\s\S]*?\n\);/)?.[0] ?? "";

  assert.match(table, /secret: text\("secret"\)/);
  assert.match(documents, /secret: created\.token/);
  assert.match(documents, /secret: agentTokens\.secret/);
});

test("connection dialog copies and downloads the skill without minting a key", () => {
  const actions = readFileSync(
    join(root, "src/components/tokens/connection-skill-actions.tsx"),
    "utf8",
  );
  const agent = readFileSync(join(root, "src/components/tokens/connection-agent.tsx"), "utf8");
  const dialog = readFileSync(
    join(root, "src/components/tokens/connection-dialog-panel.tsx"),
    "utf8",
  );

  assert.match(actions, /label="Copy skill"/);
  assert.match(actions, />\s*Download SKILL\.md\s*</);
  assert.match(actions, /text=\{TOKEN_SKILL_FILE\}/);
  assert.match(
    readFileSync(join(root, "src/components/connect/connect-copy-action.tsx"), "utf8"),
    /navigator\.clipboard\.writeText\(text\)/,
  );
  assert.match(actions, /download = "SKILL\.md"/);
  assert.match(agent, /Agent skill/);
  assert.match(agent, /It does not\s+contain credentials\./);
  assert.doesNotMatch(actions + agent + dialog, /Create API key|Grant workspace access|Add key/);
});

test("downloaded skill file keeps the pamiac frontmatter and does not embed a secret", () => {
  const file = readFileSync(join(root, "src/components/tokens/token-skill.ts"), "utf8");

  assert.match(file, /name: pamiac/);
  assert.match(file, /\$\{TOKEN_SKILL\}/);
  assert.match(file, /App: https:\/\/pamiac\.com/);
  assert.doesNotMatch(file, /Set PAMIAC_TOKEN/);
  assert.doesNotMatch(file, /pam_[A-Za-z0-9_-]{8,}/);
});

test("readme says the skill reads PAMIAC_TOKEN from the agent environment", () => {
  const readme = readFileSync(join(root, "README.md"), "utf8");
  const agents = readme.split("## Agents")[1] ?? "";

  assert.match(agents, /The skill reads `PAMIAC_TOKEN` from the agent environment\./);
});
