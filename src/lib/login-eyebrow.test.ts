import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const login = readFileSync(new URL("../app/login/page.tsx", import.meta.url), "utf8");
const copy = readFileSync(
  new URL("../components/login/login-sign-in-copy.tsx", import.meta.url),
  "utf8",
);
const form = readFileSync(new URL("../components/login-form.tsx", import.meta.url), "utf8");
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

describe("login eyebrow", () => {
  it("names the product with the home page line", () => {
    const column = slice(form, '<div className="sign-in-column">', "</div>");
    const homeEyebrow = home.match(/<p className="eyebrow">([^<]*)<\/p>/);

    assert.ok(homeEyebrow, "home eyebrow");
    expect(copy).toMatch(/eyebrow="Notes, UML, and agents"/);
    expect(homeEyebrow[1]).toBe("Notes, UML, and agents");
    expect(column).toMatch(/<LoginSignInCopy \/>/);
    expect(column).not.toMatch(/className="feature"/);
    expect(copy).toMatch(/title="Sign in or register"/);
    expect(copy).toMatch(
      /We email you a link\. There is no password\. If the address is new, opening the link\s+creates\s+the account\./,
    );
    expect(form).toMatch(/status !== "sent" \? <LoginSignInCopy \/> : null/);
    expect(login).toMatch(/<LoginForm nextPath=\{formNext\} \/>/);
    expect(login).toMatch(/<AppHeader \/>/);
    expect(login).not.toMatch(/className="auth-ground"/);
    expect(login).not.toMatch(/className="auth-card"/);
  });

  it("paints the sign-in label with the teal token over the card paragraph color", () => {
    const cardCopy = slice(css, ".auth-card p {", "}");
    const label = slice(css, ".eyebrow {", "}");
    const dark = slice(css, "@media (prefers-color-scheme: dark)", "color-scheme: dark");

    expect(login).toMatch(/className="hero sign-in"/);
    expect(login).not.toMatch(/auth-door/);
    expect(copy).toMatch(/eyebrow="Notes, UML, and agents"/);
    expect(cardCopy).toMatch(/color:\s*var\(--ink-soft\)/);
    expect(label).toMatch(/color:\s*var\(--teal\)/);
    expect(label).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    expect(label).not.toMatch(/var\(--ink-soft\)/);
    expect(dark).toMatch(/--teal:\s*#6ec9c0/);
    expect(css).toMatch(/--teal:\s*#0e6b66/);
  });
});
