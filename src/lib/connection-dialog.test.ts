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

describe("new connection dialog", () => {
  it("keeps credentials out of the agent skill surface", () => {
    const agent = read("src/components/tokens/connection-agent.tsx");

    expect(agent).toMatch(/It does not\s+contain credentials\./);
    expect(agent).toMatch(/PAMIAC_SKILL_URL/);
    expect(agent).not.toMatch(/pam_[A-Za-z0-9]{8,}/);
  });

  it("keeps the skill job and the manual MCP job on their own surfaces", () => {
    const agent = read("src/components/tokens/connection-agent.tsx");
    const mcp = read("src/components/connect/connect-manual-mcp.tsx");
    const platforms = read("src/lib/connect-platforms.ts");
    const picker = read("src/components/connect/connect-picker.tsx");
    const agentSetup = read("src/components/connect/connect-agent-setup.tsx");

    expect(agent).toMatch(/<ConnectionSkillActions \/>/);
    expect(agent).toMatch(/The Pamiac skill teaches your agent how to work safely/);
    expect(mcp).toMatch(/does not have a Pamiac setup button/);
    expect(mcp).toMatch(/<ConnectionMcpEndpoint \/>/);
    expect(platforms).toMatch(/Copy setup prompt/);
    expect(platforms).not.toMatch(/Install in ChatGPT|Coming soon\.\.\./);
    expect(agent).not.toMatch(/ConnectionMcpEndpoint|Copy link|window\.location/);
    expect(picker).toMatch(/Connect Pamiac/);
    expect(picker).toMatch(/<ConnectAgentSetup \/>/);
    expect(agentSetup).toMatch(/Let your agent configure Pamiac/);
    expect(picker).not.toMatch(/Mikhail|mikhail@example\.com|Oct 3, 2026/);
  });

  it("keeps manual MCP on the public URL and does not invent an install URL", () => {
    const agent = read("src/components/tokens/connection-agent.tsx");
    const mcp = read("src/components/connect/connect-manual-mcp.tsx");
    const platforms = read("src/lib/connect-platforms.ts");

    expect(mcp).toMatch(/Use Pamiac OAuth when your client supports it\./);
    expect(mcp).toMatch(/Create API token/);
    expect(mcp).not.toMatch(/const ENDPOINT|\{ENDPOINT\}|window\.location\.origin/);
    expect(agent).not.toMatch(/Paste this endpoint\./);
    expect(platforms).not.toMatch(/https:\/\/pamiac\.com\/oauth\/consent/);
    expect(platforms).not.toMatch(/https:\/\/cursor\.com|https:\/\/chatgpt\.com/);
    expect(
      platforms
        .replace("Connect Pamiac to Cursor in one click.", "")
        .replace('blurb: "One click"', ""),
    ).not.toMatch(/one click/i);
  });

  it("publishes the public MCP URL instead of the page origin", () => {
    const endpoint = read("src/components/tokens/connection-mcp-endpoint.tsx");

    expect(endpoint).toMatch(/PAMIAC_MCP_URL/);
    expect(endpoint).not.toMatch(/window\.location/);
    expect(endpoint).not.toMatch(/useState|useEffect/);
    expect(endpoint).toMatch(/href=\{PAMIAC_MCP_URL\}/);
    expect(endpoint).toMatch(/Copy MCP URL/);
    expect(endpoint).not.toMatch(/PAMIAC_TOKEN|token=|pam_[A-Za-z0-9_-]{8,}/);
    expect(read("src/app/api/mcp/route.ts")).toMatch(/export async function POST/);
  });

  it("copies the public MCP URL through the shared copy action", () => {
    const endpoint = read("src/components/tokens/connection-mcp-endpoint.tsx");
    const copy = read("src/components/connect/connect-copy-action.tsx");

    expect(endpoint).toMatch(/<a className="dev-link" href=\{PAMIAC_MCP_URL\}>/);
    expect(endpoint).toMatch(/<ConnectCopyAction label="Copy MCP URL" text=\{PAMIAC_MCP_URL\} \/>/);
    expect(endpoint).not.toMatch(/<button[\s>]/);
    expect(copy).toMatch(/navigator\.clipboard\.writeText\(text\)/);
    expect(copy).toMatch(/copied \? "Copied" : label/);
    expect(copy).not.toMatch(/TOKEN_SKILL|Skill copied|Could not copy the skill/);
  });

  it("keeps a long MCP link wrapping and keyboard-visible inside the library dialog", () => {
    const css = read("src/app/globals.css");
    const link = slice(css, ".dev-link {", ".workspace {");
    const endpoint = slice(
      css,
      ".library-shell .token-connect-endpoint {",
      ".library-shell .token-connect-dialog h3 {",
    );

    expect(link).toMatch(/word-break: break-all;/);
    expect(endpoint).toMatch(/display: grid;/);
    expect(endpoint).toMatch(/\.dev-link \{[\s\S]*width: 100%;/);
    expect(endpoint).toMatch(
      /\.dev-link:focus-visible \{[\s\S]*outline: 2px solid var\(--home-lime\);/,
    );
    expect(endpoint).toMatch(/\.text-pretty \{[\s\S]*margin: 0;/);
  });

  it("paints connection dialog errors in the dark library panel color", () => {
    const css = read("src/app/globals.css");

    expect(css).toMatch(/\.library-shell \.token-connect-dialog \.error \{\s*color: #ffb4ab;\s*\}/);
  });

  it("keeps the selected connection tab label readable on hover", () => {
    const css = read("src/app/globals.css");
    const hover = slice(
      css,
      '.library-shell .token-connect-tabs .btn.secondary[aria-pressed="true"]:hover {',
      ".library-shell .token-connect-dialog .btn.ghost {",
    );

    expect(hover).toMatch(/background:\s*transparent;/);
    expect(hover).toMatch(/\n\s*color:\s*var\(--home-lime\);/);
    expect(hover).toMatch(
      /\.library-shell \.token-connect-dialog \.btn\.secondary:not\(\[aria-pressed="true"\]\) \{\s*background: transparent;\s*border-color: var\(--home-hair-strong\);\s*color: var\(--home-text\);\s*\}/,
    );
    expect(hover).toMatch(
      /\.btn\.secondary:hover:not\(\[aria-pressed="true"\]\) \{\s*border-color: var\(--home-lime\);\s*color: var\(--home-lime\);\s*\}/,
    );
  });

  it("shows a failed skill copy as an alert and a successful copy as Copied", () => {
    const actions = read("src/components/tokens/connection-skill-actions.tsx");
    const copy = read("src/components/connect/connect-copy-action.tsx");

    expect(actions).toMatch(/label="Copy skill"/);
    expect(actions).toMatch(/text=\{TOKEN_SKILL_FILE\}/);
    expect(copy).toMatch(/Couldn't copy automatically\. Select and copy the value manually\./);
    expect(copy).toMatch(/<Alert>\{COPY_FAILURE\}<\/Alert>/);
    expect(copy).toMatch(/role="status"/);
    expect(copy).toMatch(/copied \? "Copied" : label/);
    expect(actions).not.toMatch(/<Paragraph/);
  });
});
