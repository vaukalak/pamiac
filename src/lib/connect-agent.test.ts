import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  AGENT_CONNECT_URL,
  AGENT_SETUP_PROMPT,
  connectAccessLabel,
  connectTokenName,
  cursorInstallUrl,
  platformFromClientId,
} from "./connect-platforms.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("connect agent platforms", () => {
  it("maps a real OAuth client host and ignores an unknown client", () => {
    assert.equal(platformFromClientId("https://chatgpt.com/oauth/client.json"), "chatgpt");
    assert.equal(platformFromClientId("https://cursor.com/oauth/client"), "cursor");
    assert.equal(platformFromClientId("https://claude.ai/oauth/client"), "claude");
    assert.equal(platformFromClientId("https://example.com/oauth/client"), null);
    assert.equal(platformFromClientId(""), null);
  });

  it("describes personal space plus the real workspace count", () => {
    assert.equal(connectAccessLabel(0), "Personal space and 0 workspaces");
    assert.equal(connectAccessLabel(1), "Personal space and 1 workspace");
    assert.equal(connectAccessLabel(2), "Personal space and 2 workspaces");
  });

  it("copies the setup prompt and installs Cursor through the documented deeplink", () => {
    const platforms = read("src/lib/connect-platforms.ts");
    const setup = read("src/components/connect/connect-agent-setup.tsx");
    const install = read("src/components/connect/connect-cursor-install.tsx");
    const url = cursorInstallUrl();
    const config = new URL(url).searchParams.get("config");
    const payload = Buffer.from(config ?? "", "base64").toString("utf8");

    assert.equal(AGENT_CONNECT_URL, "https://pamiac.com/connect/agent");
    assert.equal(
      AGENT_SETUP_PROMPT,
      "Connect yourself to Pamiac using these instructions: https://pamiac.com/connect/agent",
    );
    assert.match(setup, /Let your agent configure Pamiac/);
    assert.match(setup, /Copy setup prompt/);
    assert.match(setup, /Copy link/);
    assert.match(setup, /AGENT_SETUP_PROMPT/);
    assert.match(setup, /text=\{AGENT_CONNECT_URL\}/);
    assert.match(url, /^cursor:\/\/anysphere\.cursor-deeplink\/mcp\/install\?name=Pamiac&config=/);
    assert.equal(payload, JSON.stringify({ url: "https://pamiac.com/api/mcp" }));
    assert.equal(JSON.parse(payload).name, undefined);
    assert.match(install, /cursorInstallUrl\(\)/);
    assert.match(install, /Add Pamiac to Cursor/);
    assert.match(install, /Opening Cursor…/);
    assert.match(install, /window\.location\.assign\(cursorInstallUrl\(\)\)/);
    assert.doesNotMatch(install, /writeText|AGENT_CONNECT_URL|AGENT_SETUP_PROMPT/);
    assert.match(read("src/components/connect/connect-mcp-copy.tsx"), /Copy MCP URL/);
    assert.match(read("src/components/connect/connect-cursor-fallback.tsx"), /Show manual setup/);
    assert.doesNotMatch(
      read("src/components/connect/connect-cursor-fallback.tsx"),
      /\/api\/tokens|Create token/,
    );
    assert.doesNotMatch(
      platforms.replace("Connect Pamiac to Cursor in one click.", ""),
      /one click/i,
    );
    assert.doesNotMatch(platforms, /https:\/\/cursor\.com|https:\/\/chatgpt\.com/);
    assert.doesNotMatch(
      platforms,
      /Install in ChatGPT|Connect Claude|Connect Gemini|Connect Grok|Connect DeepSeek|Connect this agent/,
    );
  });

  it("gives Claude a web MCP copy and a Claude Code install command", () => {
    const mode = read("src/components/connect/connect-claude-mode.tsx");
    const web = read("src/components/connect/connect-claude-web.tsx");
    const code = read("src/components/connect/connect-claude-code.tsx");
    const mcp = read("src/components/connect/connect-mcp-copy.tsx");

    assert.match(mode, /Claude Web \/ Desktop/);
    assert.match(mode, /Claude Code/);
    assert.match(read("src/lib/connect-platforms.ts"), /No API key required/);
    assert.match(web, /platform\.checklist/);
    assert.match(web, /<ConnectMcpCopy \/>/);
    assert.match(web, /Copy MCP URL|ConnectMcpCopy/);
    assert.match(web, /Using an agent to configure Claude\?/);
    assert.match(mcp, /PAMIAC_MCP_URL/);
    assert.match(mcp, /Copy MCP URL/);
    assert.doesNotMatch(mcp, /window\.location\.origin/);
    assert.match(code, /Copy install command/);
    assert.match(code, /CLAUDE_CODE_INSTALL_COMMAND/);
    assert.match(code, /Let Claude Code configure itself/);
    assert.doesNotMatch(code, /Open Claude settings|npx /i);
  });

  it("defaults only the connect token form to 90 days and the platform name", () => {
    const connect = read("src/components/connect/connect-api-token.tsx");
    const form = read("src/components/tokens/token-create-form.tsx");
    const dialog = read("src/components/tokens/token-create-dialog.tsx");

    assert.equal(connectTokenName("cursor"), "Cursor on this computer");
    assert.equal(connectTokenName("claude"), "Claude on work laptop");
    assert.equal(connectTokenName("chatgpt"), "ChatGPT on this computer");
    assert.equal(connectTokenName("gemini"), "Gemini on this computer");
    assert.equal(connectTokenName("grok"), "Grok on this computer");
    assert.equal(connectTokenName("deepseek"), "DeepSeek on this computer");
    assert.equal(connectTokenName("other"), "Custom coding agent");
    const fields = read("src/components/connect/connect-api-token-fields.tsx");
    assert.match(connect, /<ConnectApiTokenFields /);
    assert.match(fields, /defaultExpiration="90d"/);
    assert.match(fields, /defaultName=\{connectTokenName\(platformId\)\}/);
    assert.match(form, /defaultName \?\? "Cloud agent"/);
    assert.match(form, /defaultExpiration \?\? "never"/);
    assert.match(dialog, /<TokenCreateForm \/>/);
    assert.doesNotMatch(dialog, /defaultExpiration|90d/);
  });

  it("reads consents without returning OAuth tokens or a sample account", () => {
    const route = read("src/app/api/connect/agent/route.ts");
    const consents = read("src/lib/connect-consents.ts");
    const connected = read("src/components/connect/connect-platform-connected.tsx");
    const page = read("src/app/connect/agent/page.tsx");

    assert.match(route, /listConnectConsents\(user\.id\)/);
    assert.match(route, /name: user\.name/);
    assert.match(route, /email: user\.email/);
    assert.match(consents, /clientId: oauthConsent\.clientId/);
    assert.match(consents, /createdAt: oauthConsent\.createdAt/);
    assert.doesNotMatch(
      route + consents,
      /oauthAccessToken|oauthRefreshToken|accessToken|refreshToken/,
    );
    assert.doesNotMatch(connected, /Mikhail|mikhail@example\.com|Oct 3, 2026|Just now/);
    assert.match(connected, /if \(!account\.data \|\| !match\) return null;/);
    assert.match(connected, /connectConsentsQueryOptions\(\)/);
    assert.match(read("src/components/connect/connect-connected-banner.tsx"), /Access approved/);
    assert.doesNotMatch(
      read("src/components/connect/connect-connected-banner.tsx"),
      /platformName\} connected|can now access/,
    );
    assert.match(read("src/components/connect/connect-copy-action.tsx"), /<Alert>/);
    assert.match(read("src/components/connect/connect-copy-action.tsx"), /role="status"/);
    assert.match(read("src/components/connect/connect-self-serve.tsx"), /COPY_SETUP_PROMPT_LABEL/);
    assert.match(read("src/components/connect/connect-self-serve.tsx"), /AGENT_SETUP_PROMPT/);
    assert.doesNotMatch(
      read("src/components/connect/connect-advanced-entry.tsx"),
      /API token · Manual MCP configuration · Download skill/,
    );
    assert.match(page, /ConnectAgentSignedIn/);
    assert.match(page, /ConnectAgentSignIn/);
    assert.match(page, /getSession\(/);
    assert.match(page, /<CircuitBoard \/>/);
  });
});
