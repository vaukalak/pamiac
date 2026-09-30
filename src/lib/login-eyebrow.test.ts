import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const login = readFileSync(new URL("../app/login/page.tsx", import.meta.url), "utf8");
const copy = readFileSync(
  new URL("../components/login/login-sign-in-copy.tsx", import.meta.url),
  "utf8",
);
const form = readFileSync(new URL("../components/login-form.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

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

describe("login eyebrow", () => {
  it("names the page in the title and skips the kicker", () => {
    expect(login).not.toMatch(/eyebrow|Notes, UML, and agents|auth-ground/);
    expect(copy).toMatch(/<PageTitle title="Sign in or register" \/>/);
    expect(copy).not.toMatch(/eyebrow/);
    expect(copy).toMatch(
      /We email you a link\. There is no password\. If the address is new, opening the link\s+creates\s+the account\./,
    );
    expect(form).toMatch(/sent \? null : <LoginSignInCopy \/>/);
    expect(login).toMatch(/<LoginForm nextPath=\{formNext\} showDevLink=\{showDevLink\} \/>/);
    expect(login).toMatch(/<AppHeader \/>/);
  });

  it("keeps the teal desk token off the sign-in title", () => {
    expect(login).not.toMatch(/<p className="eyebrow">/);
    expect(css).toMatch(/\.home \.home-sign-in-panel h1\s*\{[^}]*font-family:\s*var\(--sans\)/);
    expect(css).toMatch(/--teal:\s*#0e6b66/);
    expect(css).not.toMatch(/\.home \.home-sign-in-panel \.eyebrow/);
  });
});
