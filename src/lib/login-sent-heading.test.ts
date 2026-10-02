import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const page = readFileSync(new URL("../app/login/page.tsx", import.meta.url), "utf8");
const form = readFileSync(
  new URL("../components/login/login-magic-link-form.tsx", import.meta.url),
  "utf8",
);
const chooser = readFileSync(
  new URL("../components/login/login-chooser.tsx", import.meta.url),
  "utf8",
);
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
  it("uses the board title for Check your email", () => {
    const sentTitle = block(css, ".home .home-sign-in-panel h1 {");
    const sharedTitle = block(css, ".auth-card h1 {");

    expect(sent).toMatch(/title="Check your email"/);
    expect(sent).toMatch(/<PageTitle/);
    expect(sent).not.toMatch(/<h2>Check your email<\/h2>/);
    expect(sentTitle).toMatch(/font-family:\s*var\(--sans\)/);
    expect(sentTitle).toMatch(/font-size:\s*32px/);
    expect(sentTitle).toMatch(/line-height:\s*1\.15/);
    expect(sentTitle).not.toMatch(/22px|24px|40px/);
    expect(css).not.toMatch(/\.login-sent h2/);
    expect(sharedTitle).toMatch(/font-size:\s*40px/);
  });

  it("drops the sign-in copy once a link has been sent, including from the server page", () => {
    const panel = slice(page, '<Section className="home-sign-in-panel">', "</Section>");
    const sentBranch = slice(form, "sent ? (", ") : (");

    expect(panel).not.toMatch(/eyebrow|Notes, UML, and agents/);
    expect(panel).not.toMatch(/<h1>/);
    expect(panel).not.toMatch(/There is no password/);
    expect(sentBranch).toMatch(/<LoginLinkSent/);
    expect(sentBranch).not.toMatch(/LoginSignInCopy/);
    expect(sentBranch).not.toMatch(/Sign in or register/);
    expect(chooser).toMatch(/<LoginSignInCopy \/>/);
    expect(form).not.toMatch(/LoginSignInCopy/);
  });
});
