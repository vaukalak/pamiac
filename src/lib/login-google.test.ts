import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const shell = readFileSync(new URL("../components/login-form.tsx", import.meta.url), "utf8");
const chooser = readFileSync(
  new URL("../components/login/login-chooser.tsx", import.meta.url),
  "utf8",
);
const magic = readFileSync(
  new URL("../components/login/login-magic-link-form.tsx", import.meta.url),
  "utf8",
);
const password = readFileSync(
  new URL("../components/login/login-password-form.tsx", import.meta.url),
  "utf8",
);
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
  it("keeps Google on the chooser and off the sent card", () => {
    const sentCard = slice(magic, "{sent ? (", ") : (");

    expect(sentCard).toMatch(/<LoginLinkSent/);
    expect(sentCard).not.toMatch(/LoginGoogle|Continue with Google|magic link/);
    expect(chooser).toMatch(/<LoginGoogle /);
    expect(chooser).toMatch(/Send Magic Link/);
    expect(chooser).toMatch(/onClick=\{onMagicLink\}/);
    expect(chooser).toMatch(/Or continue with email \/ password/);
    expect(chooser).toMatch(/onClick=\{onPassword\}/);
    expect(shell).toMatch(/onMagicLink=\{\(\) => \{\s*setStep\("magic"\);\s*\}\}/);
    expect(shell).toMatch(/onPassword=\{\(\) => \{\s*setStep\("password"\);\s*\}\}/);
    expect(magic).toMatch(/>\s*Back\s*</);
    expect(password).toMatch(/>\s*Back\s*</);
    expect(magic).toMatch(/authClient\.signIn\.magicLink\(/);
    expect(magic).not.toMatch(/LoginGoogle/);
    expect(password).not.toMatch(/LoginGoogle/);
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
