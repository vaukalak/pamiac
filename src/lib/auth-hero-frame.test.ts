import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const login = readFileSync(new URL("../app/login/page.tsx", import.meta.url), "utf8");
const support = readFileSync(new URL("../app/support/page.tsx", import.meta.url), "utf8");
const supportForm = readFileSync(
  new URL("../components/support/support-form.tsx", import.meta.url),
  "utf8",
);
const copy = readFileSync(
  new URL("../components/login/login-sign-in-copy.tsx", import.meta.url),
  "utf8",
);
const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const consent = readFileSync(new URL("../app/oauth/consent/page.tsx", import.meta.url), "utf8");
const locked = readFileSync(new URL("../components/locked-document.tsx", import.meta.url), "utf8");

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

describe("auth hero frame", () => {
  it("puts support copy on the left and one feature card around the form", () => {
    const card = slice(support, '<Section className="feature form-stack">', "</Section>");

    expect(support).toMatch(/<Page className="hero">/);
    expect(support).not.toMatch(/sign-in|auth-wrap|auth-card/);
    expect(support).toMatch(/eyebrow="Support"/);
    expect(support).toMatch(/title="Contact support"/);
    expect(support).toMatch(/className="lede">This message goes to Pamiac support\./);
    expect(card).toMatch(
      /<Paragraph>Use the email you sign in with\.<\/Paragraph>\s*<SupportForm \/>/,
    );
    expect(support).toMatch(/title: "Support"/);
    expect(support).toMatch(/description: "Send a message to Pamiac support."/);
    expect(supportForm).toMatch(/<div className="form-stack" role="status">/);
  });

  it("scopes the sign-in email sheet so the support field keeps the shared fill", () => {
    const sheet = slice(css, '.sign-in .feature input[type="email"] {', "}");
    const fields = slice(
      css,
      'input[type="text"],\ninput[type="email"],\ninput[type="password"],\ntextarea,\nselect {',
      "}",
    );

    expect(login).toMatch(/<Page className="hero sign-in">/);
    expect(copy).toMatch(/className="lede"/);
    expect(sheet).toMatch(/background:\s*var\(--card\)/);
    expect(fields).toMatch(/background:\s*var\(--field\)/);
    expect(support).not.toMatch(/className="hero sign-in"/);
    expect(css).not.toMatch(/\.hero \.feature input\[type="email"\]/);
  });

  it("leaves oauth consent and the locked document on the auth card", () => {
    expect(consent).toMatch(/<main className="auth-wrap">/);
    expect(consent).not.toMatch(/className="hero/);
    expect(locked).toMatch(/<main className="auth-wrap">/);
    expect(locked).toMatch(/<section className="auth-card">/);
    expect(locked).not.toMatch(/className="hero/);
    expect(css).toMatch(/\.auth-card\s*\{[^}]*width:\s*min\(460px,\s*calc\(100% - 32px\)\)/);
  });
});
