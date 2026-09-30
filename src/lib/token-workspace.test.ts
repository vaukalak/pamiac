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

describe("token workspace binding", () => {
  it("stores a member workspace and null for personal", () => {
    const schema = read("src/db/schema.ts");
    const table = schema.match(/export const agentTokens = pgTable\([\s\S]*?\n\);/)?.[0] ?? "";
    const column =
      table.match(/workspaceId: text\("workspace_id"\)\.references\([\s\S]*?\),/)?.[0] ?? "";
    const store = read("src/lib/documents.ts");
    const bound = slice(
      store,
      "async function boundTokenWorkspace",
      "export async function issueToken",
    );
    const issue = slice(
      store,
      "export async function issueToken",
      "export async function revokeToken",
    );
    const listed = slice(
      store,
      "export async function listTokens",
      "async function boundTokenWorkspace",
    );
    const route = read("src/app/api/tokens/route.ts");

    expect(column).toMatch(
      /workspaceId: text\("workspace_id"\)\.references\(\(\) => workspaces\.id, \{ onDelete: "cascade" \}\)/,
    );
    expect(column).not.toMatch(/notNull/);
    expect(column).not.toMatch(/default\(/);
    expect(bound).toMatch(/const value = workspaceId\?\.trim\(\) \?\? ""/);
    expect(bound).toMatch(/if \(!value \|\| value === PERSONAL_SPACE_ID\) return null/);
    expect(bound).toMatch(/listMemberWorkspaces\(userId\)/);
    expect(bound).toMatch(/HttpError\(404, "Workspace not found"\)/);
    expect(issue).toMatch(/boundTokenWorkspace\(userId, workspaceId\)/);
    expect(issue).toMatch(/workspaceId: boundWorkspaceId/);
    expect(issue).not.toMatch(/workspaceId:\s*"personal"/);
    expect(listed).toMatch(/workspaceId: agentTokens\.workspaceId/);
    expect(route).toMatch(/workspaceId: z\.string\(\)\.optional\(\)/);
    expect(route).toMatch(/issueToken\(user\.id, input\.name, expiresAt, input\.workspaceId\)/);
  });

  it("exposes the token workspace on agent auth and keeps the library cookie unscope", () => {
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

    expect(lookup).toMatch(/workspaceId: agentTokens\.workspaceId/);
    expect(lookup).toMatch(/workspaceId: row\.workspaceId/);
    expect(bearer).toMatch(
      /return \{ id: result\.user\.id, workspaceId: result\.user\.workspaceId \}/,
    );
    expect(bearer).not.toMatch(/PAMIAC_TOKEN_COOKIE/);
    expect(library).not.toMatch(/agent\.workspaceId/);
    expect(library).toMatch(/listLibraryDocuments\(/);
  });

  it("limits a personal token before membership and blocks a write outside that scope", () => {
    const store = read("src/lib/documents.ts");
    const where = slice(
      store,
      "function agentDocumentWhere",
      "export async function listAgentDocuments",
    );
    const personal = where.slice(
      where.indexOf("if (!workspaceId)"),
      where.indexOf("const membership"),
    );
    const write = slice(
      store,
      "export async function updateDocumentContent",
      "export async function deleteDocument",
    );
    const listRoute = read("src/app/api/agent/v1/documents/route.ts");
    const searchRoute = read("src/app/api/agent/v1/search/route.ts");
    const mcp = read("src/lib/mcp-server.ts");
    const account = slice(
      store,
      "function accountDocumentWhere",
      "async function searchVisibleDocuments",
    );

    expect(where.indexOf("if (!workspaceId)") < where.indexOf("const membership")).toBe(true);
    expect(personal).toMatch(/eq\(documents\.ownerId, userId\)/);
    expect(personal).toMatch(/isNull\(documents\.workspaceId\)/);
    expect(personal).not.toMatch(/workspaceMembers|exists\(membership\)/);
    expect(write).toMatch(/boundWorkspaceId !== undefined/);
    expect(write).toMatch(
      /documentInTokenWorkspace\(current, userId, boundWorkspaceId, workspaceMember\)/,
    );
    expect(write).toMatch(
      /if \(!boundWorkspaceId\) return document\.ownerId === userId && !document\.workspaceId/,
    );
    expect(write).toMatch(/return document\.workspaceId === boundWorkspaceId && workspaceMember/);
    expect(listRoute).toMatch(
      /updateDocumentContent\(\s*agent\.id,\s*created\.id,\s*\{\s*content: input\.content\s*\},\s*agent\.workspaceId,\s*\)/,
    );
    expect(searchRoute).not.toMatch(/searchAccountDocuments/);
    expect(mcp).toMatch(/searchAccountDocuments\(userId, query, limit\)/);
    expect(mcp).not.toMatch(/searchDocuments\(/);
    expect(account).toMatch(/eq\(workspaceMembers\.workspaceId, documents\.workspaceId\)/);
  });

  it("picks a workspace in the create form and shows the binding on each key", () => {
    const form = read("src/components/tokens/token-form.tsx");
    const facts = read("src/components/tokens/token-facts.tsx");
    const token = read("src/components/tokens/agent-token.ts");
    const page = read("src/components/tokens/token-manager.tsx");
    const skill = page.match(/const SKILL = `([\s\S]*?)`;/)?.[1] ?? "";
    const select = read("src/ui/Form/Select.tsx");
    const menu = read("src/ui/Form/SelectMenu.tsx");
    const exported = read("src/ui/Form/index.ts");

    expect(form).not.toMatch(/useState/);
    expect(form).toMatch(/useForm<TokenValues>/);
    expect(form).toMatch(/name: "Cloud agent"/);
    expect(form).toMatch(/workspaceId: PERSONAL_SPACE_ID/);
    expect(form).toMatch(/expiration: "never"/);
    expect(form).toMatch(/workspacesQueryOptions\(\)/);
    expect(form).toMatch(/librarySpaces\(spaces\.data \?\? \[\]\)/);
    expect(form).toMatch(/<Form\.Context/);
    expect(form).toMatch(/<Form\.Input label="Name" name="name" \/>/);
    expect(form).toMatch(
      /<Form\.Select label="Workspace" name="workspaceId" options=\{workspaceOptions\} \/>/,
    );
    expect(form).toMatch(/workspaceId: values\.workspaceId/);
    expect(form).toMatch(/mutation\.isPending/);
    expect(form).not.toMatch(/<input|<select/);
    expect(form).toMatch(/expiration === "date"/);
    expect(form).toMatch(/name="date"/);
    expect(form).toMatch(/type="date"/);
    expect(facts).toMatch(/useQuery\(workspacesQueryOptions\(\)\)/);
    expect(facts).toMatch(/if \(!workspaceId\) return "Personal space"/);
    expect(facts).toMatch(/if \(!label\) return "Workspace"/);
    expect(facts).toMatch(/\["Workspace", boundWorkspaceName\(token\.workspaceId/);
    expect(token).toMatch(/workspaceId: string \| null/);
    expect(skill).toMatch(
      /Search reaches the workspace this token was bound to, and a personal binding reaches only that user's personal documents\./,
    );
    expect(select).toMatch(/<label htmlFor=\{name\}>\{label\}<\/label>/);
    expect(select).toMatch(/<Alert id=\{errorId\}>\{message\}<\/Alert>/);
    expect(menu).toMatch(/\{\.\.\.register\(name\)\}/);
    expect(exported).toMatch(/Select: FormSelect/);
  });
});
