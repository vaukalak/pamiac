import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { readStylesheet } from "./stylesheet.ts";

const page = readFileSync(new URL("../app/login/page.tsx", import.meta.url), "utf8");
const css = readStylesheet();

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

describe("login desk", () => {
  it("centers sign-in on the home board and drops the ground diagram", () => {
    expect(page).toMatch(/<div className="home">/);
    expect(page).toMatch(/<CircuitBoard \/>/);
    expect(page).toMatch(/<AppHeader \/>/);
    expect(page).toMatch(/<Page className="home-sign-in">/);
    expect(page).toMatch(/<Section className="home-sign-in-panel">/);
    expect(page).toMatch(
      /<LoginForm\s+agentConnect=\{isOAuthLoginQuery\(query\)\}\s+googleEnabled=\{googleSignInEnabled\(\)\}\s+nextPath=\{formNext\}\s+showDevLink=\{showDevLink\}\s*\/>/,
    );
    expect(page).toMatch(
      /<footer className="home-foot">\s*<p>Built for human ideas and machine intelligence\.<\/p>/,
    );
    expect(page).not.toMatch(/auth-wrap|auth-door|auth-ground|auth-card|eyebrow/);
    expect(page).not.toMatch(/<main|<button|<input|<select/);
  });

  it("leaves the paper desk tokens in place for every other route", () => {
    expect(css).toMatch(/\.auth-card\s*\{/);
    expect(css).toMatch(/background:\s*var\(--field\)/);
    expect(css).toMatch(
      /input:focus,\s*textarea:focus,\s*select:focus\s*\{[^}]*border-color:\s*var\(--teal\)/,
    );
    expect(page).not.toMatch(/auth-ground-note|auth-ground-diagram/);
  });
});
