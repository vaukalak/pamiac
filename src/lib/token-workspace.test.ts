import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function expect(actual: unknown) {
  const text = String(actual);
  return {
    toBe(expected: unknown) {
      assert.equal(actual, expected);
    },
    toBeLessThan(expected: number) {
      assert.equal(typeof actual, "number");
      assert.ok(Number(actual) < expected, `${String(actual)} < ${expected}`);
    },
    toMatch(pattern: RegExp) {
      assert.match(text, pattern);
    },
    not: {
      toMatch(pattern: RegExp) {
        assert.doesNotMatch(text, pattern);
      },
    },
  };
}

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

function slice(source: string, start: string, end?: string) {
  const from = source.indexOf(start);
  assert.ok(from >= 0, start);
  if (!end) return source.slice(from);
  const to = source.indexOf(end, from + start.length);
  assert.ok(to > from, end);
  return source.slice(from, to);
}

describe("token scope", () => {
  it("stores all scopes or an explicit list and migrates old rows without widening them", () => {
    const schema = read("src/db/schema.ts");
    const table = schema.match(/export const agentTokens = pgTable\([\s\S]*?\n\);/)?.[0] ?? "";
    const migration = read("drizzle/0003_agent-token-scope.sql");
    const journal = read("drizzle/meta/_journal.json");

    expect(table).toMatch(/allScopes: boolean\("all_scopes"\)\.notNull\(\)/);
    expect(table).toMatch(/workspaceIds: text\("workspace_ids"\)\.array\(\)\.notNull\(\)/);
    expect(table).not.toMatch(/workspaceId:/);
    expect(migration).toMatch(/SET "workspace_ids" = ARRAY\['personal'\]/);
    expect(migration).toMatch(/WHERE "workspace_id" IS NULL/);
    expect(migration).toMatch(/SET "workspace_ids" = ARRAY\["workspace_id"\]/);
    expect(migration).toMatch(/WHERE "workspace_id" IS NOT NULL/);
    expect(migration).toMatch(/DROP COLUMN "workspace_id"/);
    expect(migration.indexOf("ARRAY['personal']")).toBeLessThan(migration.indexOf("DROP COLUMN"));
    expect(journal).toMatch(/"tag": "0003_agent-token-scope"/);
  });

  it("issues and updates a scope without rotating the secret", () => {
    const store = read("src/lib/documents.ts");
    const resolve = slice(store, "async function resolveTokenScope", "function uniqueScopeIds");
    const issue = slice(
      store,
      "export async function issueToken",
      "export async function updateToken",
    );
    const update = slice(
      store,
      "export async function updateToken",
      "export async function revokeToken",
    );
    const listed = slice(store, "export async function listTokens", "function scopeFromRow");
    const route = read("src/app/api/tokens/route.ts");

    expect(resolve).toMatch(/if \(scope\.all\) return \{ allScopes: true, workspaceIds: \[\]/);
    expect(resolve).toMatch(/HttpError\(400, "Choose at least one space"\)/);
    expect(resolve).toMatch(/HttpError\(404, "Workspace not found"\)/);
    expect(resolve).toMatch(/listMemberWorkspaces\(userId\)/);
    expect(resolve).toMatch(/id !== PERSONAL_SPACE_ID/);
    expect(resolve).not.toMatch(/allScopes: true, workspaceIds: workspaceIds/);
    expect(issue).toMatch(/resolveTokenScope\(userId, scope\)/);
    expect(issue).toMatch(/allScopes: stored\.allScopes/);
    expect(issue).toMatch(/workspaceIds: stored\.workspaceIds/);
    expect(issue).toMatch(/secret: created\.token/);
    expect(update).toMatch(/allScopes: stored\.allScopes/);
    expect(update).toMatch(/workspaceIds: stored\.workspaceIds/);
    expect(update).not.toMatch(/secret:|tokenHash:|tokenPrefix:/);
    expect(listed).toMatch(/allScopes: agentTokens\.allScopes/);
    expect(listed).toMatch(/workspaceIds: agentTokens\.workspaceIds/);
    expect(listed).not.toMatch(/workspaceId: agentTokens\.workspaceId/);
    expect(route).toMatch(/all: z\.literal\(true\)/);
    expect(route).toMatch(/all: z\.literal\(false\), workspaceIds: z\.array\(z\.string\(\)\)/);
    expect(route).toMatch(/issueToken\(user\.id, input\.name, expiresAt, input\.scope\)/);
    expect(route).toMatch(/updateToken\(user\.id, id, input\.name, input\.scope\)/);
    expect(route).not.toMatch(/workspaceId: z\.string\(\)/);
  });

  it("returns the token scope from bearer auth and leaves the library board unscoped", () => {
    const store = read("src/lib/documents.ts");
    const lookup = slice(
      store,
      "async function authenticateAgentToken",
      "export async function requireAgentUser",
    );
    const bearer = slice(
      store,
      "export async function requireAgentUser",
      "export async function agentUserFromCookie",
    );
    const library = read("src/app/workspace/page.tsx");

    expect(lookup).toMatch(/allScopes: agentTokens\.allScopes/);
    expect(lookup).toMatch(/workspaceIds: agentTokens\.workspaceIds/);
    expect(lookup).toMatch(/scope: scopeFromRow\(row\)/);
    expect(bearer).toMatch(/return \{ id: result\.user\.id, scope: result\.user\.scope \}/);
    expect(bearer).not.toMatch(/workspaceId/);
    expect(bearer).not.toMatch(/PAMIAC_TOKEN_COOKIE/);
    expect(library).not.toMatch(/agent\.workspaceId|agent\.scope/);
    expect(library).toMatch(/listLibraryDocuments\(/);
  });

  it("limits list, search, and write to the chosen spaces", () => {
    const store = read("src/lib/documents.ts");
    const where = slice(
      store,
      "function agentDocumentWhere",
      "export async function listAgentDocuments",
    );
    const selected = slice(
      store,
      "function selectedDocumentWhere",
      "export async function listAgentDocuments",
    );
    const write = slice(
      store,
      "function documentInTokenScope",
      "export async function deleteDocument",
    );
    const search = slice(
      store,
      "export async function searchDocuments",
      "export async function searchAccountDocuments",
    );
    const create = slice(
      store,
      "export async function agentCreateWorkspace",
      "export async function listLibraryDocuments",
    );
    const listRoute = read("src/app/api/agent/v1/documents/route.ts");
    const searchRoute = read("src/app/api/agent/v1/search/route.ts");
    const mcp = read("src/lib/mcp-server.ts");
    const account = slice(
      store,
      "function accountDocumentWhere",
      "async function searchVisibleDocuments",
    );

    expect(where).toMatch(/if \(scope\.allScopes\) return accountDocumentWhere\(userId\)/);
    expect(selected).toMatch(/workspaceIds\.includes\(PERSONAL_SPACE_ID\)/);
    expect(selected).toMatch(
      /and\(eq\(documents\.ownerId, userId\), isNull\(documents\.workspaceId\)\)/,
    );
    expect(selected).toMatch(/eq\(workspaceMembers\.workspaceId, documents\.workspaceId\)/);
    expect(selected).toMatch(/inArray\(workspaceMembers\.workspaceId, selected\)/);
    expect(selected).toMatch(/inArray\(documents\.workspaceId, selected\)/);
    expect(write).toMatch(/scope\.allScopes/);
    expect(write).toMatch(/scope\.workspaceIds\.includes\(PERSONAL_SPACE_ID\)/);
    expect(write).toMatch(
      /scope\.workspaceIds\.includes\(document\.workspaceId\) && workspaceMember/,
    );
    expect(search).toMatch(
      /if \(scope\.allScopes\) return searchAccountDocuments\(userId, query, limit\)/,
    );
    expect(search).toMatch(/agentDocumentWhere\(userId, scope\)/);
    expect(create).toMatch(
      /scope\.allScopes \|\| scope\.workspaceIds\.includes\(PERSONAL_SPACE_ID\)/,
    );
    expect(create).toMatch(/if \(selected\.length === 1\) return selected\[0\]/);
    expect(create).toMatch(/selected\.find\(\(id\) => memberIds\.has\(id\)\)/);
    expect(create).toMatch(/HttpError\(404, "Workspace not found"\)/);
    expect(listRoute).toMatch(/listAgentDocuments\(agent\.id, agent\.scope\)/);
    expect(listRoute).toMatch(/agentCreateWorkspace\(agent\.id, agent\.scope\)/);
    expect(listRoute).toMatch(
      /createDocument\(\s*agent\.id,\s*input\.type,\s*input\.title,\s*workspaceId\s*\)/,
    );
    expect(listRoute).toMatch(/updateDocumentContent\([\s\S]*agent\.scope,\s*\)/);
    expect(searchRoute).toMatch(/agent\.scope\.allScopes/);
    expect(searchRoute).toMatch(
      /searchAccountDocuments\(agent\.id, input\.query, input\.limit \?\? 8\)/,
    );
    expect(searchRoute).toMatch(
      /searchDocuments\(agent\.id, input\.query, input\.limit \?\? 8, agent\.scope\)/,
    );
    expect(mcp).toMatch(/scope\.allScopes/);
    expect(mcp).toMatch(/searchAccountDocuments\(userId, query, limit\)/);
    expect(mcp).toMatch(/searchDocuments\(userId, query, limit, scope\)/);
    expect(account).toMatch(/eq\(workspaceMembers\.workspaceId, documents\.workspaceId\)/);
    expect(store).not.toMatch(/agentTokens\.workspaceId(?!s)/);
  });

  it("picks all scopes or selected spaces in the form and describes that reach in the skill", () => {
    const form = read("src/components/tokens/token-create-form.tsx");
    const spaces = read("src/components/tokens/token-scope-spaces.tsx");
    const checkbox = read("src/components/tokens/token-scope-space.tsx");
    const token = read("src/components/tokens/agent-token.ts");
    const skill = read("src/components/tokens/token-skill.ts");
    const dialog = read("src/components/tokens/connection-dialog-panel.tsx");
    const picker = read("src/components/connect/connect-picker.tsx");
    const agentSetup = read("src/components/connect/connect-agent-setup.tsx");
    const tabs = read("src/components/tokens/connection-tabs.tsx");
    const agentTab = read("src/components/tokens/connection-agent.tsx");
    const page = read("src/app/workspace/tokens/page.tsx");

    expect(form).not.toMatch(/useState/);
    expect(form).toMatch(/useForm<TokenValues>/);
    expect(form).toMatch(/name: defaultName \?\? "Cloud agent"/);
    expect(form).toMatch(/scope: "all"/);
    expect(form).toMatch(/expiration: defaultExpiration \?\? "never"/);
    expect(form).toMatch(/<Form\.Context/);
    expect(form).toMatch(/<TokenScopeFields/);
    expect(form).toMatch(/expirationLabel = "Expiration"/);
    expect(form).toMatch(/mutation\.isPending/);
    expect(form).not.toMatch(/<input|<select|workspaceId/);
    expect(form).toMatch(/Choose at least one space/);
    expect(spaces).toMatch(/workspacesQueryOptions\(\)/);
    expect(spaces).toMatch(/librarySpaces\(spaces\.data \?\? \[\]\)/);
    expect(spaces).toMatch(/scope !== "selected"/);
    expect(checkbox).toMatch(/type="checkbox"/);
    expect(checkbox).toMatch(/register\(`spaces\.\$\{id\}`\)/);
    expect(token).toMatch(/allScopes: boolean/);
    expect(token).toMatch(/workspaceIds: string\[\]/);
    expect(token).not.toMatch(/workspaceId: string \| null/);
    expect(skill).toMatch(
      /All scopes reach personal documents and every workspace the user belongs to\./,
    );
    expect(skill).toMatch(/A selected scope reaches only the chosen spaces\./);
    expect(skill).toMatch(/Read PAMIAC_TOKEN from the agent environment/);
    expect(skill).toMatch(/Do not ask the user to paste the token/);
    expect(skill).not.toMatch(/pam_[A-Za-z0-9_-]{8,}/);
    expect(picker).toMatch(/Connect Pamiac/);
    expect(picker).toMatch(/<ConnectAgentSetup \/>/);
    expect(agentSetup).toMatch(/Let your agent configure Pamiac/);
    expect(dialog).toMatch(/role="dialog"/);
    expect(dialog).toMatch(/aria-modal="true"/);
    expect(tabs).toMatch(/API token/);
    expect(tabs).toMatch(/"mcp", "Manual MCP"/);
    expect(tabs).toMatch(/Agent skill/);
    expect(read("src/components/tokens/connection-tab-button.tsx")).toMatch(/pressed=\{pressed\}/);
    expect(agentTab).toMatch(/It does not\s+contain credentials\./);
    expect(dialog + agentTab).not.toMatch(/Create API key|Grant workspace access|Add key/);
    expect(page).toMatch(/<TokenShell/);
    expect(page).toMatch(/getSession\(/);
    expect(page).not.toMatch(/AppHeader|className="workspace"/);
  });
});
