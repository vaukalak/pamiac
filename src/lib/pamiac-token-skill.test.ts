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
  const skill = readFileSync(join(root, ".cursor/skills/pamiac/SKILL.md"), "utf8");

  assert.match(skill, /Read `PAMIAC_TOKEN` from the process environment/);
  assert.match(skill, /Authorization: Bearer <PAMIAC_TOKEN>/);
  assert.match(skill, /Do not ask the user to paste the token/);
  assert.match(skill, /If `PAMIAC_TOKEN` is missing, say so and stop/);
  assert.match(skill, /Do not invent a token/);
  assert.doesNotMatch(skill, /Ask the user for a Pamiac token/);
  assert.doesNotMatch(skill, /PAMIAC_(?!TOKEN)\w*/);
  assert.match(skill, /origin the user is using/);

  for (const kind of kinds) {
    assert.match(skill, new RegExp(`\\b${kind}\\b`));
  }
  for (const relationType of relationTypes) {
    assert.match(skill, new RegExp(`\\b${relationType}\\b`));
  }

  assert.match(skill, /POST \/api\/agent\/v1\/search/);
  assert.match(skill, /GET \/api\/agent\/v1\/documents\?type=diagram/);
  assert.match(skill, /GET \/api\/agent\/v1\/documents\/:id/);
  assert.match(skill, /POST \/api\/agent\/v1\/documents/);
  assert.match(skill, /PATCH \/api\/agent\/v1\/documents\/:id/);
});

test("token page names PAMIAC_TOKEN in the lede and the agent skill text", () => {
  const page = readFileSync(join(root, "src/components/tokens/token-manager.tsx"), "utf8");
  const lede = page.match(/className="lede">([\s\S]*?)<\/p>/)?.[1] ?? "";
  const skill = page.match(/const SKILL = `([\s\S]*?)`;/)?.[1] ?? "";

  assert.match(lede, /PAMIAC_TOKEN/);
  assert.match(lede, /cloud agent's environment/);
  assert.match(lede, /token you just/);
  assert.match(skill, /PAMIAC_TOKEN/);
  assert.match(skill, /Set PAMIAC_TOKEN in the cloud agent's environment/);
  assert.match(skill, /Authorization: Bearer <PAMIAC_TOKEN>/);
  assert.match(skill, /Do not ask the user to paste the token/);
  assert.match(skill, /App: the origin the user is using/);
  assert.match(skill, /Base: \/api\/agent\/v1/);
  assert.match(skill, /POST \/search/);
});

test("agent tokens keep the secret so the token page can show it again", () => {
  const schema = readFileSync(join(root, "src/db/schema.ts"), "utf8");
  const documents = readFileSync(join(root, "src/lib/documents.ts"), "utf8");
  const table = schema.match(/export const agentTokens = pgTable\([\s\S]*?\n\);/)?.[0] ?? "";

  assert.match(table, /secret: text\("secret"\)/);
  assert.match(documents, /secret: created\.token/);
  assert.match(documents, /secret: agentTokens\.secret/);
});

test("token page copies and downloads the skill", () => {
  const page = readFileSync(join(root, "src/components/tokens/token-manager.tsx"), "utf8");

  assert.match(page, />\s*copy skill\s*</);
  assert.match(page, />\s*download skill\s*</);
  assert.match(page, /navigator\.clipboard\.writeText\(SKILL\)/);
  assert.match(page, /download = "SKILL\.md"/);
});

test("readme says the skill reads PAMIAC_TOKEN from the agent environment", () => {
  const readme = readFileSync(join(root, "README.md"), "utf8");
  const agents = readme.split("## Agents")[1] ?? "";

  assert.match(agents, /The skill reads `PAMIAC_TOKEN` from the agent environment\./);
});
