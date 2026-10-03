import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

const tokenSentence = "PAMIAC_TOKEN has to be configured in the environment.";

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
  it("keeps the token sentence on the agent skill surface", () => {
    const agent = read("src/components/tokens/connection-agent.tsx");

    expect(agent).toMatch(new RegExp(`<Paragraph>${tokenSentence}</Paragraph>`));
    expect(agent.split(tokenSentence).length - 1).toBe(1);
    expect(agent).toMatch(/Without that token, the skill offers sign-in with Google\./);
  });

  it("keeps the skill job and the manual MCP job on their own surfaces", () => {
    const agent = read("src/components/tokens/connection-agent.tsx");
    const mcp = read("src/components/connect/connect-manual-mcp.tsx");
    const platforms = read("src/lib/connect-platforms.ts");
    const picker = read("src/components/connect/connect-picker.tsx");

    expect(agent).toMatch(/<ConnectionSkillActions \/>/);
    expect(agent).toMatch(/The skill contains instructions, not credentials\./);
    expect(mcp).toMatch(/Publisher submission, and ChatGPT developer mode/);
    expect(mcp).toMatch(/<ConnectionMcpEndpoint \/>/);
    expect(platforms).toMatch(/Install in ChatGPT/);
    expect(platforms).not.toMatch(/Coming soon\.\.\./);
    expect(agent).not.toMatch(/ConnectionMcpEndpoint|Copy link|window\.location/);
    expect(picker).toMatch(/Connect Pamiac/);
    expect(picker).toMatch(/Give your AI this link/);
    expect(picker).not.toMatch(/Mikhail|mikhail@example\.com|Oct 3, 2026/);
  });

  it("keeps the paste cue on manual MCP and does not invent an install URL", () => {
    const agent = read("src/components/tokens/connection-agent.tsx");
    const mcp = read("src/components/connect/connect-manual-mcp.tsx");
    const platforms = read("src/lib/connect-platforms.ts");

    expect(mcp).toMatch(/<Paragraph>Paste this endpoint\.<\/Paragraph>/);
    expect(mcp.split("Paste this endpoint.").length - 1).toBe(1);
    expect(mcp.indexOf("PAMIAC_TOKEN has to be configured in the environment.")).toBeLessThan(
      mcp.indexOf("Paste this endpoint."),
    );
    expect(mcp.indexOf("<Paragraph>Paste this endpoint.</Paragraph>")).toBeLessThan(
      mcp.indexOf("<ConnectionMcpEndpoint />"),
    );
    expect(mcp).not.toMatch(/const ENDPOINT|\{ENDPOINT\}|\/api\/mcp/);
    expect(agent).not.toMatch(/Paste this endpoint\./);
    expect(platforms).not.toMatch(/https:\/\/pamiac\.com\/oauth\/consent/);
    expect(platforms).not.toMatch(/https:\/\/cursor\.com|https:\/\/chatgpt\.com|one click/i);
  });

  it("builds the absolute MCP URL after mount and renders nothing until it exists", () => {
    const endpoint = read("src/components/tokens/connection-mcp-endpoint.tsx");
    const effect = slice(endpoint, "useEffect(", "async function copyLink");

    expect(endpoint).toMatch(/^"use client";/);
    expect(endpoint).toMatch(/const \[url, setUrl\] = useState\(""\);/);
    expect(effect).toMatch(/setUrl\(`\$\{window\.location\.origin\}\/api\/mcp`\);/);
    expect(effect).toMatch(/\}, \[\]\);/);
    expect(endpoint.replace(effect, "")).not.toMatch(/window\.location/);
    expect(endpoint).toMatch(/if \(!url\) return null;/);
    expect(endpoint).not.toMatch(/href=""|href="\/api\/mcp"|https?:\/\/|pamiac\.com/);
    expect(endpoint).not.toMatch(/PAMIAC_TOKEN|token=|pam_[A-Za-z0-9_-]{8,}/);
    expect(read("src/app/api/mcp/route.ts")).toMatch(/export async function POST/);
  });

  it("shows that URL as an anchor and copies the same value", () => {
    const endpoint = read("src/components/tokens/connection-mcp-endpoint.tsx");
    const copy = slice(endpoint, "async function copyLink", "if (!url)");

    expect(endpoint).toMatch(/<a className="dev-link" href=\{url\}>\s*\{url\}\s*<\/a>/);
    expect(endpoint).toMatch(/from "@\/ui\/Button"/);
    expect(endpoint).toMatch(
      /<Button className="secondary" onClick=\{\(\) => void copyLink\(\)\} type="button">\s*Copy link\s*<\/Button>/,
    );
    expect(endpoint).not.toMatch(/<button[\s>]/);
    expect(copy.indexOf('setMessage("")')).toBeLessThan(copy.indexOf("writeText(url)"));
    expect(copy).toMatch(/navigator\.clipboard\.writeText\(url\)/);
    expect(copy).toMatch(/setMessage\("Link copied\."\)/);
    expect(copy).toMatch(/setMessage\("Could not copy the link\."\)/);
    expect(copy).not.toMatch(/TOKEN_SKILL|Skill copied|Could not copy the skill/);
    expect(endpoint).toMatch(
      /\{message === "Could not copy the link\." \? <Alert>\{message\}<\/Alert> : null\}/,
    );
    expect(endpoint).toMatch(
      /\{message === "Link copied\." \? \(\s*<p className="text-pretty" role="status">\s*\{message\}\s*<\/p>\s*\) : null\}/,
    );
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

    expect(hover).toMatch(/background:\s*var\(--home-lime\);/);
    expect(hover).toMatch(/\n\s*color:\s*var\(--home-on-lime\);/);
    expect(hover).toMatch(
      /\.library-shell \.token-connect-dialog \.btn\.secondary:not\(\[aria-pressed="true"\]\) \{\s*background: transparent;\s*border-color: var\(--home-hair-strong\);\s*color: var\(--home-text\);\s*\}/,
    );
    expect(hover).toMatch(
      /\.btn\.secondary:hover:not\(\[aria-pressed="true"\]\) \{\s*border-color: var\(--home-lime\);\s*color: var\(--home-lime\);\s*\}/,
    );
  });

  it("shows a failed skill copy as an alert and a successful copy as status text", () => {
    const actions = read("src/components/tokens/connection-skill-actions.tsx");

    expect(actions).toMatch(/setMessage\("Could not copy the skill\."\)/);
    expect(actions).toMatch(/setMessage\("Skill copied\."\)/);
    expect(actions).toMatch(
      /\{message === "Could not copy the skill\." \? <Alert>\{message\}<\/Alert> : null\}/,
    );
    expect(actions).toMatch(
      /\{message === "Skill copied\." \? \(\s*<p className="text-pretty" role="status">\s*\{message\}\s*<\/p>\s*\) : null\}/,
    );
    expect(actions).not.toMatch(/<Paragraph/);
  });
});
