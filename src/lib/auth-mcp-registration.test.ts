import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const auth = readFileSync(new URL("./auth.ts", import.meta.url), "utf8");

function mcpOptions() {
  const start = auth.indexOf("mcp({");
  const end = auth.indexOf("})", start);
  assert.ok(start >= 0);
  assert.ok(end > start);
  return auth.slice(start, end);
}

describe("MCP dynamic client registration", () => {
  it("enables dynamic and unauthenticated client registration on mcp()", () => {
    const options = mcpOptions();

    assert.match(options, /allowDynamicClientRegistration:\s*true/);
    assert.match(options, /allowUnauthenticatedClientRegistration:\s*true/);
    assert.doesNotMatch(options, /oidcConfig/);
  });

  it("keeps the existing login, consent, and resource options", () => {
    const options = mcpOptions();

    assert.match(options, /loginPage:\s*"\/login"/);
    assert.match(options, /consentPage:\s*"\/oauth\/consent"/);
    assert.match(options, /resource:\s*mcpResourceUrl\(\)/);
  });

  it("does not enable any other mcp option", () => {
    const options = mcpOptions();
    const keys = [...options.matchAll(/^\s{8}([A-Za-z]+):/gm)].map((match) => match[1]);

    assert.deepEqual(keys, [
      "loginPage",
      "consentPage",
      "resource",
      "allowDynamicClientRegistration",
      "allowUnauthenticatedClientRegistration",
    ]);
  });

  it("leaves CIMD client metadata discovery unchanged", () => {
    const start = auth.indexOf("cimd({");
    const end = auth.indexOf("})", start);
    assert.ok(start >= 0);
    assert.ok(end > start);
    const options = auth.slice(start, end);

    assert.match(options, /fetchClientMetadataResource/);
    assert.match(options, /metadataProfile:\s*"mcp-2026-07-28"/);
    assert.doesNotMatch(options, /allowDynamicClientRegistration/);
  });
});
