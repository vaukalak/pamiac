import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const auth = readFileSync(new URL("./auth.ts", import.meta.url), "utf8");

function betterAuthConfig() {
  const start = auth.indexOf("return betterAuth({");
  const plugins = auth.indexOf("plugins:", start);
  assert.ok(start >= 0);
  assert.ok(plugins > start);
  return auth.slice(start, plugins);
}

describe("Gemini account-linking trusted origins", () => {
  it("trusts the Google static host that serves the client-assertion JWKS", () => {
    const config = betterAuthConfig();

    assert.match(config, /trustedOrigins:\s*\[\s*"https:\/\/www\.gstatic\.com",?\s*\]/);
  });

  it("does not trust other Google origins that are not the JWKS check", () => {
    const config = betterAuthConfig();

    assert.doesNotMatch(config, /accountlinking\.google\.com/);
    assert.doesNotMatch(config, /googleusercontent\.com/);
    assert.doesNotMatch(config, /https:\/\/google\.com/);
    assert.doesNotMatch(config, /https:\/\/\*\.gstatic\.com/);
    assert.doesNotMatch(config, /https:\/\/www\.gstatic\.com\//);
  });

  it("leaves default OAuth scopes unchanged", () => {
    assert.doesNotMatch(auth, /\bscopes\s*:/);
  });
});
