import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  CHATGPT_DIRECTORY_STATUS,
  CLAUDE_CODE_INSTALL_COMMAND,
  PAMIAC_MCP_URL,
  PAMIAC_SKILL_URL,
} from "./connect-platforms.ts";
import { publishedSkillMarkdown } from "./skill-markdown.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("connect spec gaps", () => {
  it("copies the Claude Code install command from the public MCP URL", () => {
    assert.equal(
      CLAUDE_CODE_INSTALL_COMMAND,
      "claude mcp add --transport http pamiac https://pamiac.com/api/mcp",
    );
    const code = read("src/components/connect/connect-claude-code.tsx");
    assert.match(code, /CLAUDE_CODE_INSTALL_COMMAND/);
    assert.match(code, /Copy install command/);
    assert.match(code, /Claude Code command copied/);
  });

  it("keeps ChatGPT pending and does not offer Install in ChatGPT", () => {
    assert.equal(CHATGPT_DIRECTORY_STATUS, "pending");
    const pending = read("src/components/connect/connect-chatgpt-pending.tsx");
    const setup = read("src/components/connect/connect-chatgpt-setup.tsx");
    assert.match(
      pending,
      /Pamiac for ChatGPT is awaiting directory approval\. You can connect it manually now\./,
    );
    assert.match(pending, /Copy MCP URL|ConnectMcpCopy/);
    assert.doesNotMatch(pending + setup, /Install in ChatGPT/);
    assert.match(setup, /CHATGPT_DIRECTORY_STATUS === "pending"/);
  });

  it("uses one public MCP URL constant", () => {
    assert.equal(PAMIAC_MCP_URL, "https://pamiac.com/api/mcp");
    const platforms = read("src/lib/connect-platforms.ts");
    assert.match(platforms, /export const CURSOR_MCP_URL = PAMIAC_MCP_URL/);
    assert.equal(platforms.split("https://pamiac.com/api/mcp").length - 1, 1);
    assert.doesNotMatch(
      read("src/components/tokens/connection-mcp-endpoint.tsx"),
      /window\.location\.origin/,
    );
  });

  it("serves the published skill at /skill.md without a secret", () => {
    const route = read("src/app/skill.md/route.ts");
    const body = publishedSkillMarkdown();
    assert.match(route, /publishedSkillMarkdown\(\)/);
    assert.equal(PAMIAC_SKILL_URL, "https://pamiac.com/skill.md");
    assert.match(body, /# Pamiac/);
    assert.match(read("src/components/tokens/connection-agent.tsx"), /PAMIAC_SKILL_URL/);
    assert.doesNotMatch(route + body, /pam_[A-Za-z0-9]{8,}/);
    assert.doesNotMatch(body, /Authorization: Bearer pam_[A-Za-z0-9]/);
  });

  it("changes a copy button label to Copied and alerts when the clipboard fails", () => {
    const copy = read("src/components/connect/connect-copy-action.tsx");
    assert.match(copy, /copied \? "Copied" : label/);
    assert.match(copy, /setTimeout\(\(\) => setCopied\(false\), 2000\)/);
    assert.match(copy, /Couldn't copy automatically\. Select and copy the value manually\./);
    assert.match(copy, /<Alert>\{COPY_FAILURE\}<\/Alert>/);
  });

  it("limits the connect token form expirations without shrinking the tokens page list", () => {
    const fields = read("src/components/connect/connect-api-token-fields.tsx");
    const values = read("src/components/tokens/token-values.ts");
    const expirations = fields.slice(
      fields.indexOf("CONNECT_EXPIRATIONS"),
      fields.indexOf("interface Properties"),
    );

    assert.match(expirations, /30 days/);
    assert.match(expirations, /90 days/);
    assert.match(expirations, /1 year/);
    assert.match(expirations, /Never/);
    assert.doesNotMatch(expirations, /7 days|Custom date|No expiration/);
    assert.match(values, /7 days/);
    assert.match(values, /Custom date/);
    assert.match(values, /No expiration/);
  });

  it("puts agent instructions on the connect page without the document HTTP API", () => {
    const page = read("src/app/connect/agent/page.tsx");
    const instructions = read("src/components/connect/connect-agent-instructions.tsx");
    const setup = read("src/components/connect/connect-agent-setup.tsx");

    assert.match(page, /<ConnectAgentInstructions \/>/);
    assert.match(instructions, /PAMIAC_MCP_URL/);
    assert.match(instructions, /PAMIAC_SKILL_URL/);
    assert.match(instructions, /list_workspaces/);
    assert.match(instructions, /never print the\s+token/);
    assert.doesNotMatch(
      instructions,
      /\/api\/agent\/v1\/documents|POST https:\/\/pamiac\.com\/api\/agent/,
    );
    assert.match(setup, /OR LET YOUR AGENT DO IT/);
    assert.doesNotMatch(setup, /MCP/);
  });

  it("shows a placeholder after the token reveal and does not invent settings links", () => {
    const created = read("src/components/connect/connect-token-created.tsx");
    const example = read("src/components/connect/connect-token-example.tsx");
    const surfaces = [
      "src/components/connect/connect-claude-web.tsx",
      "src/components/connect/connect-chatgpt-pending.tsx",
      "src/components/connect/connect-gemini-setup.tsx",
      "src/components/connect/connect-grok-setup.tsx",
    ]
      .map((path) => read(path))
      .join("\n");

    assert.match(created, /Your API token/);
    assert.match(created, /You won&apos;t be able to see it again\./);
    assert.match(created, /Copy token/);
    assert.match(example, /PAMIAC_TOKEN=pam_\.\.\./);
    assert.match(example, /Authorization: Bearer <PAMIAC_TOKEN>/);
    assert.doesNotMatch(example, /secret/);
    assert.doesNotMatch(
      surfaces,
      /Open (Claude|ChatGPT|Gemini|Grok) settings|Open Grok connectors/,
    );
    assert.match(read("src/components/connect/connect-chooser.tsx"), /tab: "mcp"/);
  });
});
