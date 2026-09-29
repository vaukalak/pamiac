import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const login = readFileSync(new URL("../app/login/page.tsx", import.meta.url), "utf8");
const home = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
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
    toBe(expected: string) {
      assert.equal(actual, expected);
    },
  };
}

function slice(source: string, startMark: string, endMark: string) {
  const start = source.indexOf(startMark);
  assert.ok(start >= 0, startMark);
  const end = source.indexOf(endMark, start + startMark.length);
  assert.ok(end > start, endMark);
  return source.slice(start, end);
}

function eyebrowText(source: string) {
  const match = source.match(/<p className="eyebrow">([^<]*)<\/p>/);
  assert.ok(match, "eyebrow");
  return match[1];
}

describe("login eyebrow", () => {
  it("names the product with the home page line", () => {
    const card = slice(login, '<section className="auth-card">', "</section>");

    expect(eyebrowText(login)).toBe(eyebrowText(home));
    expect(eyebrowText(login)).toBe("Notes, UML, and agents");
    expect(card).not.toMatch(/>Account</);
    expect(card).toMatch(/<h1>Sign in or register<\/h1>/);
    expect(card).toMatch(
      /We email you a link\. There is no password\. If the address is new, opening the link\s+creates the account\./,
    );
    expect(card).toMatch(/<LoginForm nextPath=\{nextPath\} \/>/);
    expect(login).toMatch(/<AppHeader \/>/);
    expect(login).toMatch(/className="auth-ground"/);
  });

  it("paints the sign-in label with the teal token over the card paragraph color", () => {
    const cardCopy = slice(css, ".auth-card p {", "}");
    const label = slice(css, ".auth-door .auth-card .eyebrow {", "}");
    const dark = slice(css, "@media (prefers-color-scheme: dark)", "color-scheme: dark");

    expect(login).toMatch(/className="auth-wrap auth-door"/);
    expect(login).toMatch(/<p className="eyebrow">/);
    expect(cardCopy).toMatch(/color:\s*var\(--ink-soft\)/);
    expect(label).toMatch(/color:\s*var\(--teal\)/);
    expect(label).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    expect(label).not.toMatch(/var\(--ink-soft\)/);
    expect(dark).toMatch(/--teal:\s*#6ec9c0/);
    expect(css).toMatch(/--teal:\s*#0e6b66/);
  });
});
