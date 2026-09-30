import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const form = readFileSync(new URL("../components/login-form.tsx", import.meta.url), "utf8");
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
    const sentBranch = slice(form, 'status === "sent"', ": (");
    const formBranch = slice(form, ": (", "  );");

    expect(sentBranch).toMatch(/<LoginLinkSent/);
    expect(sentBranch).toMatch(/address=\{email\}/);
    expect(sentBranch).not.toMatch(/<input/);
    expect(sentBranch).not.toMatch(/type="submit"/);
    expect(formBranch).toMatch(/<form className="form-stack"/);
    expect(formBranch).toMatch(/<input[\s\S]*type="email"/);
    expect(formBranch).toMatch(/type="submit"/);
    expect(formBranch).not.toMatch(/status === "sent"/);
    expect(sent).toMatch(/<h1>Check your email<\/h1>/);
    expect(sent).toMatch(/We sent a link to \{address\}\./);
    expect(sent).toMatch(/Check your inbox, then spam, then promotions,/);
    expect(sent).toMatch(/and it can take a minute\./);
    expect(sent).not.toMatch(/Email me a link again/);
    expect(sent).toMatch(/Use a different email/);
    expect(sent).toMatch(/className="btn ghost"/);
    expect(sent).not.toMatch(/className="btn"/);
    expect(sent).not.toMatch(/Check your inbox for a sign-in link/);
    expect(sent).not.toMatch(/New emails are registered/);
    expect(sent).not.toMatch(/aria-live/);
    expect(form).toMatch(/aria-live="polite"/);
    expect(sent).not.toMatch(/magic/i);
    expect(sent).not.toMatch(/\{email\}/);
    expect(sent).not.toMatch(/sessionStorage|localStorage/);
    expect(form).toMatch(/setEmail\(""\)/);
    expect(form).toMatch(/setStatus\("idle"\)/);
    expect(form).toMatch(
      /status === "error" && !addressRejected \? <LoginSendFailure happened=\{message\} \/> : null/,
    );
  });
});
