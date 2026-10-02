import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const auth = readFileSync(new URL("./auth.ts", import.meta.url), "utf8");
const example = readFileSync(new URL("../../.env.example", import.meta.url), "utf8");
const form = readFileSync(new URL("../components/login-form.tsx", import.meta.url), "utf8");
const google = readFileSync(
  new URL("../components/login/login-google-continue.tsx", import.meta.url),
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
  it("adds Google only when both credentials are set", () => {
    const gate = slice(auth, "function googleSocialProviders()", "function buildAuth()");

    expect(gate).toMatch(/GOOGLE_CLIENT_ID/);
    expect(gate).toMatch(/GOOGLE_CLIENT_SECRET/);
    expect(gate).toMatch(/if \(clientId === "" \|\| clientSecret === ""\) return \{\}/);
    expect(gate).toMatch(/socialProviders:\s*\{\s*google:\s*\{\s*clientId,\s*clientSecret,\s*\}/);
    expect(auth).toMatch(/\.\.\.googleSocialProviders\(\)/);
    expect(example).toMatch(/^GOOGLE_CLIENT_ID=$/m);
    expect(example).toMatch(/^GOOGLE_CLIENT_SECRET=$/m);
  });

  it("keeps Google and the divider off the sent card", () => {
    const sentCard = slice(form, "{sent ? (", ") : (");
    const idle = slice(form, ") : (", "</Form.Context>");

    expect(sentCard).toMatch(/<LoginLinkSent/);
    expect(sentCard).not.toMatch(/LoginGoogleContinue|Continue with Google|magic link/);
    expect(idle).toMatch(/<LoginGoogleContinue nextPath=\{nextPath\} \/>/);
    expect(idle).toMatch(/or continue with a magic link/);
    assert.ok(idle.indexOf("LoginGoogleContinue") < idle.indexOf("or continue with a magic link"));
    assert.ok(idle.indexOf("or continue with a magic link") < idle.indexOf('label="Email"'));
    expect(sent).not.toMatch(/LoginGoogleContinue|Continue with Google|magic link/);
    expect(copy).not.toMatch(/magic/i);
  });

  it("signs in with Google through the shared client and the existing failure sentence", () => {
    expect(google).toMatch(/authClient\.signIn\.social\(\{/);
    expect(google).toMatch(/provider: "google"/);
    expect(google).toMatch(/callbackURL: nextPath/);
    expect(google).toMatch(/useMutation\(/);
    expect(google).toMatch(/disabled=\{mutation\.isPending\}/);
    expect(google).toMatch(/type="button"/);
    expect(google).toMatch(/Google sign-in is not available yet\./);
    expect(google).toMatch(/provider not found/i);
    expect(google).toMatch(/loginSendFailureSentence\(/);
    expect(google).toMatch(/<LoginSendFailure happened=\{message\} \/>/);
    expect(google).toMatch(/This Google account opens the desk\./);
    expect(google).toMatch(/Continue with Google/);
    expect(google).not.toMatch(/<button|magic link|Could not send the magic link|useState\(/);
    expect(google).toMatch(/viewBox="0 0 48 48"/);
    expect(google).toMatch(/fill="currentColor"/);
    expect(google).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
    expect(google).toMatch(/aria-hidden="true"/);
  });
});
