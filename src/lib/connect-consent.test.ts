import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("oauth consent copy", () => {
  it("lists document capabilities and does not render a token", () => {
    const card = read("src/components/oauth/consent-card.tsx");
    const capabilities = read("src/components/oauth/consent-capabilities.tsx");
    const actions = read("src/components/oauth/consent-actions.tsx");
    const signIn = read("src/components/oauth/consent-sign-in.tsx");
    const page = read("src/app/oauth/consent/page.tsx");

    assert.match(card, /Connect \$\{clientLabel\} to Pamiac/);
    assert.match(card, /\$\{clientLabel\} wants to access your Pamiac documents\./);
    assert.match(card, /<ConsentCapabilities \/>/);
    assert.match(capabilities, /Search notes and diagrams/);
    assert.match(capabilities, /Read documents/);
    assert.match(capabilities, /Create documents/);
    assert.match(capabilities, /Edit documents/);
    assert.match(actions, /authClient\.oauth2\.consent\(\{ accept \}\)/);
    assert.match(actions, /Allow/);
    assert.match(actions, /Deny/);
    assert.match(actions, /decision\.mutate\(true\)/);
    assert.match(actions, /decision\.mutate\(false\)/);
    assert.doesNotMatch(
      card + capabilities + actions + signIn,
      /oauthAccessToken|access_token|refreshToken|pam_/,
    );
    assert.match(signIn, /href=\{href\}/);
    assert.match(signIn, /Sign in/);
    assert.match(page, /ConsentSignIn href=\{consentLoginHref\(query\)\}/);
    assert.match(page, /result\.session \?/);
  });
});
