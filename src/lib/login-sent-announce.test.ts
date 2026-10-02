import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { loginAnnouncement } from "./login-announcement.ts";

const form = readFileSync(
  new URL("../components/login/login-magic-link-form.tsx", import.meta.url),
  "utf8",
);
const sent = readFileSync(
  new URL("../components/login/login-link-sent.tsx", import.meta.url),
  "utf8",
);
const failure = readFileSync(
  new URL("../components/login/login-send-failure.tsx", import.meta.url),
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

describe("sign-in confirmation announcement", () => {
  it("keeps one polite live region mounted for the whole visit", () => {
    const region = slice(form, '<div aria-atomic="true" aria-live="polite"', "</div>");
    const sentBranch = slice(form, "sent ? (", ") : (");
    const formBranch = slice(form, ") : (", "</Form.Context>");
    const lives = form.match(/aria-live=/g) ?? [];

    expect(region).toMatch(/aria-atomic="true"/);
    expect(region).toMatch(/className="login-announcement"/);
    expect(region).toMatch(/\{announcement\}/);
    expect(region).not.toMatch(/Use a different email/);
    expect(sentBranch).not.toMatch(/aria-live/);
    expect(formBranch).not.toMatch(/aria-live/);
    expect(form).toMatch(/loginAnnouncement\(/);
    expect(sent).not.toMatch(/aria-live/);
    expect(failure).not.toMatch(/aria-live/);
    expect(form).not.toMatch(/aria-live="assertive"/);
    expect(sent).not.toMatch(/sr-only|visually-hidden|aria-hidden/);
    assert.equal(lives.length, 1);
    assert.ok(form.indexOf('aria-live="polite"') < form.indexOf("sent ? ("));
    expect(form).not.toMatch(/sessionStorage|localStorage/);
    expect(sent).not.toMatch(/sessionStorage|localStorage/);
  });

  it("speaks the same field, failure, and confirmation sentences that are visible", () => {
    const hidden = block(css, ".login-announcement {");

    assert.equal(
      loginAnnouncement({
        status: "idle",
        addressError: "Enter an email address.",
        failure: "",
        address: "",
      }),
      "Enter an email address.",
    );
    assert.equal(
      loginAnnouncement({
        status: "idle",
        addressError: "That address needs an @.",
        failure: "We could not send the link.",
        address: "ada",
      }),
      "That address needs an @.",
    );
    assert.equal(
      loginAnnouncement({
        status: "error",
        addressError: "",
        failure: "We could not send the link.",
        address: "ada@example.com",
      }),
      "We could not send the link.\nTry again, or use another address.",
    );
    assert.equal(
      loginAnnouncement({
        status: "sent",
        addressError: "",
        failure: "",
        address: "ada@example.com",
      }),
      [
        "Check your email",
        "We sent a link to ada@example.com.",
        "Check your inbox, then spam, then promotions,",
        "and it can take a minute.",
      ].join("\n"),
    );
    assert.equal(
      loginAnnouncement({
        status: "sending",
        addressError: "",
        failure: "",
        address: "ada@example.com",
      }),
      "",
    );
    expect(sent).toMatch(/title="Check your email"/);
    expect(sent).toMatch(/We sent a link to \{address\}\./);
    expect(sent).toMatch(/Check your inbox, then spam, then promotions,/);
    expect(sent).toMatch(/and it can take a minute\./);
    expect(failure).toMatch(/Try again, or use another address\./);
    expect(hidden).toMatch(/position:\s*absolute/);
    expect(hidden).toMatch(/clip-path:\s*inset\(50%\)/);
    expect(hidden).not.toMatch(/color:|var\(--danger\)|var\(--ink-soft\)/);
  });
});
