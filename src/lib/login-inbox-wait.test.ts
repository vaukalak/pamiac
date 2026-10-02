import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const form = readFileSync(
  new URL("../components/login/login-magic-link-form.tsx", import.meta.url),
  "utf8",
);
const sent = readFileSync(
  new URL("../components/login/login-link-sent.tsx", import.meta.url),
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

describe("sign-in inbox wait", () => {
  it("replaces the email field and submit button with a sent confirmation", () => {
    const sentBranch = slice(form, "sent ? (", ") : (");
    const formBranch = slice(form, ") : (", "</Form.Context>");

    expect(sentBranch).toMatch(/<LoginLinkSent/);
    expect(sentBranch).toMatch(/address=\{sent\.address\}/);
    expect(sentBranch).not.toMatch(/<Form\.Input/);
    expect(sentBranch).not.toMatch(/type="submit"/);
    expect(formBranch).toMatch(/<Form\.Context/);
    expect(formBranch).toMatch(/<Form\.Input[\s\S]*type="email"/);
    expect(formBranch).toMatch(/type="submit"/);
    expect(formBranch).not.toMatch(/<LoginLinkSent/);
    expect(sent).toMatch(/title="Check your email"/);
    expect(sent).toMatch(/We sent a link to \{address\}\./);
    expect(sent).toMatch(/Check your inbox, then spam, then promotions,/);
    expect(sent).toMatch(/and it can take a minute\./);
    expect(sent).not.toMatch(/Email me a link again/);
    expect(sent).toMatch(/Use a different email/);
    expect(sent).toMatch(/className="ghost"/);
    expect(sent).toMatch(/<Button/);
    expect(sent).not.toMatch(/<button/);
    expect(sent).not.toMatch(/Check your inbox for a sign-in link/);
    expect(sent).not.toMatch(/New emails are registered/);
    expect(sent).not.toMatch(/aria-live/);
    expect(form).toMatch(/aria-live="polite"/);
    expect(sent).not.toMatch(/magic/i);
    expect(sent).not.toMatch(/\{email\}/);
    expect(sent).not.toMatch(/sessionStorage|localStorage/);
    expect(form).toMatch(/form\.reset\(\{ email: "" \}\)/);
    expect(form).toMatch(/setSent\(null\)/);
    expect(form).toMatch(
      /mutation\.isError && !addressError \? <LoginSendFailure happened=\{message\} \/> : null/,
    );
  });
});
