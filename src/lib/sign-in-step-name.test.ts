import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const home = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const nav = readFileSync(
  new URL("../components/header/app-header-nav.tsx", import.meta.url),
  "utf8",
);
const form = readFileSync(new URL("../components/login-form.tsx", import.meta.url), "utf8");
const locked = readFileSync(new URL("../components/locked-document.tsx", import.meta.url), "utf8");
const login = readFileSync(new URL("../app/login/page.tsx", import.meta.url), "utf8");

function expect(actual: string) {
  return {
    toMatch(pattern: RegExp) {
      assert.match(actual, pattern);
    },
    not: {
      toMatch(pattern: RegExp) {
        assert.doesNotMatch(actual, pattern);
      },
    },
  };
}

describe("sign-in step name", () => {
  it("uses Email me a link on the home action, the header, and the login button", () => {
    expect(home).toMatch(/<Link className="btn" href="\/login">\s*Email me a link\s*<\/Link>/);
    expect(home).not.toMatch(/Continue with email/);
    expect(nav).toMatch(/<Link className="btn" href="\/login">\s*Email me a link\s*<\/Link>/);
    expect(nav).not.toMatch(/>\s*Sign in\s*</);
    expect(form).toMatch(/status === "sending" \? "Sending link…" : "Email me a link"/);
    expect(form).not.toMatch(/Email me a magic link/);
  });

  it("states the home lede in ordinary words and leaves the other sign-in titles alone", () => {
    expect(home).toMatch(
      /We email you a link to sign in, draw UML, and write notes you can drag into shape\. Every\s+document has a direct link\./,
    );
    expect(home).not.toMatch(/magic/i);
    expect(login).toMatch(/<h1>Sign in or register<\/h1>/);
    expect(locked).toMatch(/<h1>Sign in to view<\/h1>/);
    expect(locked).toMatch(/>\s*Continue with email\s*</);
    expect(form).toMatch(/authClient\.signIn\.magicLink\(/);
  });
});
