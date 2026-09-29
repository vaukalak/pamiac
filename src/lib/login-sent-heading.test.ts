import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const page = readFileSync(new URL("../app/login/page.tsx", import.meta.url), "utf8");
const form = readFileSync(new URL("../components/login-form.tsx", import.meta.url), "utf8");
const sent = readFileSync(
  new URL("../components/login/login-link-sent.tsx", import.meta.url),
  "utf8",
);
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

function slice(source: string, startMark: string, endMark: string) {
  const start = source.indexOf(startMark);
  assert.ok(start >= 0, startMark);
  const end = source.indexOf(endMark, start + startMark.length);
  assert.ok(end > start, endMark);
  return source.slice(start, end);
}

function block(source: string, header: string) {
  const at = source.indexOf(header);
  assert.ok(at >= 0, header);
  const open = source.indexOf("{", at);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    const character = source[index];
    if (character === "{") depth += 1;
    else if (character === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(at, index + 1);
    }
  }
  assert.fail(`unclosed ${header}`);
}

describe("sent sign-in heading", () => {
  it("keeps Check your email at 22px after it becomes the card title", () => {
    const sentTitle = block(css, ".auth-door .auth-card .login-sent h1 {");
    const doorTitle = block(css, ".auth-door .auth-card h1 {");
    const sharedTitle = block(css, ".auth-card h1 {");

    expect(sent).toMatch(/<h1>Check your email<\/h1>/);
    expect(sent).not.toMatch(/<h2>Check your email<\/h2>/);
    expect(sentTitle).toMatch(/font-size:\s*22px/);
    expect(sentTitle).toMatch(/line-height:\s*1\.25/);
    expect(sentTitle).toMatch(/margin:\s*0;/);
    expect(sentTitle).not.toMatch(/24px|40px/);
    expect(css).not.toMatch(/\.login-sent h2/);
    expect(doorTitle).toMatch(/font-size:\s*24px/);
    expect(sharedTitle).toMatch(/font-size:\s*40px/);
    expect(sentTitle).toMatch(/^\.auth-door \.auth-card \.login-sent h1 \{/);
  });

  it("drops the sign-in copy once a link has been sent, including from the server page", () => {
    const card = slice(page, '<section className="auth-card">', "</section>");
    const sentBranch = slice(form, 'status === "sent" ? (', ": (");

    expect(card).toMatch(/<p className="eyebrow">Notes, UML, and agents<\/p>/);
    expect(card).not.toMatch(/<h1>/);
    expect(card).not.toMatch(/There is no password/);
    expect(sentBranch).toMatch(/<LoginLinkSent/);
    expect(sentBranch).not.toMatch(/LoginSignInCopy/);
    expect(sentBranch).not.toMatch(/Sign in or register/);
    expect(form).toMatch(/status !== "sent" \? <LoginSignInCopy \/> : null/);
  });
});
