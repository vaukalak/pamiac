import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const form = readFileSync(new URL("../components/login-form.tsx", import.meta.url), "utf8");
const google = readFileSync(
  new URL("../components/login/login-google.tsx", import.meta.url),
  "utf8",
);
const sent = readFileSync(
  new URL("../components/login/login-link-sent.tsx", import.meta.url),
  "utf8",
);
const copy = readFileSync(
  new URL("../components/login/login-sign-in-copy.tsx", import.meta.url),
  "utf8",
);

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

describe("google sign-in on the idle card", () => {
  it("keeps the Google mark and the divider off the sent card", () => {
    const sentCard = slice(form, "{sent ? (", ") : (");
    const idle = slice(form, ") : (", "</Form.Context>");

    expect(sentCard).toMatch(/<LoginLinkSent/);
    expect(sentCard).not.toMatch(/LoginGoogle|Continue with Google|magic link/);
    expect(idle).toMatch(/or continue with a magic link/);
    assert.ok(idle.indexOf("or continue with a magic link") < idle.indexOf('label="Email"'));
    expect(sent).not.toMatch(/LoginGoogle|Continue with Google|magic link/);
    expect(copy).not.toMatch(/magic/i);
  });

  it("draws the Google mark in the button ink", () => {
    expect(google).toMatch(/viewBox="0 0 48 48"/);
    expect(google).toMatch(/fill="currentColor"/);
    expect(google).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
    expect(google).toMatch(/aria-hidden="true"/);
    expect(google).toMatch(/Continue with Google/);
    expect(google).not.toMatch(/<button|magic link|useState\(/);
  });
});
