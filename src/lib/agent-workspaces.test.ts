import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function expect(actual: unknown) {
  const text = String(actual);
  return {
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

describe("agent workspaces for a token", () => {
  it("lists personal first, then current memberships, and drops a left or empty selection", () => {
    const store = read("src/lib/documents.ts");
    const list = slice(
      store,
      "const PERSONAL_SPACE_NAME",
      "export async function agentCreateWorkspace",
    );
    const route = read("src/app/api/agent/v1/workspaces/route.ts");

    expect(list).toMatch(/listMemberWorkspaces\(userId\)/);
    expect(list).toMatch(/workspace\.id !== PERSONAL_SPACE_ID/);
    expect(list).toMatch(/const PERSONAL_SPACE_NAME = "Personal space"/);
    expect(list).toMatch(/id: PERSONAL_SPACE_ID, name: PERSONAL_SPACE_NAME/);
    expect(list).toMatch(/if \(scope\.allScopes\) return \[personal, \.\.\.members\]/);
    expect(list).toMatch(/members\.filter\(\(workspace\) => selected\.has\(workspace\.id\)\)/);
    expect(list).toMatch(/if \(!selected\.has\(PERSONAL_SPACE_ID\)\) return reachable/);
    expect(list).toMatch(/return \[personal, \.\.\.reachable\]/);
    expect(list).not.toMatch(/workspaceIds\.length === 0/);
    expect(list).not.toMatch(/\.sort\(/);
    expect(list).not.toMatch(/role:/);
    expect(route).toMatch(/requireAgentUser\(request\)/);
    expect(route).toMatch(/listAgentWorkspaces\(agent\.id, agent\.scope\)/);
    expect(route).toMatch(/agentJson\(\{ workspaces \}\)/);
    expect(route).not.toMatch(/requireUserId/);
  });

  it("tells the copied skill to ask which workspace when more than one is in reach", () => {
    const skill = read("src/components/tokens/token-skill.ts");
    const open = skill.indexOf("---\n");
    const frontmatter = skill.slice(open, skill.indexOf("---", open + 4) + 3);

    expect(frontmatter).toMatch(/name: pamiac/);
    expect(frontmatter).toMatch(
      /description: Read and edit a user's Pamiac notes and UML diagrams\. Use when working with Pamiac documents, UML, or the user's diagram library\./,
    );
    expect(frontmatter).toMatch(/fast: false/);
    expect(frontmatter).not.toMatch(/model:/);
    expect(skill).toMatch(/GET \/api\/agent\/v1\/workspaces/);
    expect(skill).toMatch(
      /When more than one workspace is returned, list those workspaces and ask the user which one to use before searching, reading, or writing\./,
    );
    expect(skill).toMatch(/One workspace needs no question/);
    expect(skill).toMatch(/Do not guess/);
    expect(skill).toMatch(/Do not ask the user to paste the token/);
    expect(skill).toMatch(/Read PAMIAC_TOKEN from the agent environment/);
    expect(skill).not.toMatch(/fast: true/);
  });

  it("keeps the ChatGPT tab as a coming-soon line and leaves the MCP tab", () => {
    const chatgpt = read("src/components/tokens/connection-chatgpt.tsx");
    const mcp = read("src/components/tokens/connection-mcp.tsx");
    const tabs = read("src/components/tokens/connection-tabs.tsx");
    const panel = read("src/components/tokens/connection-panel.tsx");

    expect(chatgpt).toMatch(/<Paragraph>Coming soon\.\.\.<\/Paragraph>/);
    expect(chatgpt).not.toMatch(/plugin directory|Publisher submission|developer mode/);
    expect(chatgpt).not.toMatch(/<p[\s>]/);
    expect(mcp).toMatch(/Publisher submission, and ChatGPT developer mode/);
    expect(tabs).toMatch(/\["chatgpt", "ChatGPT"\]/);
    expect(panel).toMatch(/<ConnectionChatGpt \/>/);
    assert.throws(() => read("src/components/tokens/chatgpt-connect.tsx"));
  });
});
