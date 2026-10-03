import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  AGENT_CONNECT_URL,
  connectAccessLabel,
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

  it("copies the absolute agent URL and does not claim a one-click install", () => {
    const platforms = read("src/lib/connect-platforms.ts");
    const link = read("src/components/connect/connect-agent-link.tsx");
    const row = read("src/components/connect/connect-agent-link-row.tsx");
    const action = read("src/components/connect/connect-platform-action.tsx");

    assert.equal(AGENT_CONNECT_URL, "https://pamiac.com/connect/agent");
    assert.match(link, /writeText\(AGENT_CONNECT_URL\)/);
    assert.match(row, /AGENT_CONNECT_LABEL/);
    assert.match(action, /writeText\(AGENT_CONNECT_URL\)/);
    assert.doesNotMatch(action, /window\.open|oauth\/consent/);
    assert.doesNotMatch(platforms, /one click/i);
    assert.doesNotMatch(platforms, /https:\/\/cursor\.com|https:\/\/chatgpt\.com/);
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
    assert.doesNotMatch(connected, /Mikhail|mikhail@example\.com|Oct 3, 2026/);
    assert.match(connected, /connectConsentsQueryOptions\(\)/);
    assert.match(page, /ConnectAgentSignedIn/);
    assert.match(page, /ConnectAgentSignIn/);
    assert.match(page, /getSession\(/);
    assert.match(page, /<CircuitBoard \/>/);
  });
});
