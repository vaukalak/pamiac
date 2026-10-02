import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { loginAnnouncement } from "./login-announcement.ts";

const form = readFileSync(
  new URL("../components/login/login-magic-link-form.tsx", import.meta.url),
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

describe("login announcement", () => {
  it("prefers the visible field sentence while a send failure is hidden", () => {
    assert.equal(
      loginAnnouncement({
        status: "error",
        addressError: "Enter an email address.",
        failure: "We could not send the link.",
        address: "",
      }),
      "Enter an email address.",
    );
    assert.equal(
      loginAnnouncement({
        status: "error",
        addressError: "That address needs an @.",
        failure: "Too many attempts.",
        address: "ada",
      }),
      "That address needs an @.",
    );
  });

  it("speaks the confirmation once the form has been replaced", () => {
    const spoken = loginAnnouncement({
      status: "sent",
      addressError: "Enter an email address.",
      failure: "We could not send the link.",
      address: "ada@example.com",
    });

    assert.equal(
      spoken,
      [
        "Check your email",
        "We sent a link to ada@example.com.",
        "Check your inbox, then spam, then promotions,",
        "and it can take a minute.",
      ].join("\n"),
    );
    expect(spoken).not.toMatch(/Use a different email|Development only|Enter an email address/);
  });

  it("keeps a human server sentence and the same next step", () => {
    assert.equal(
      loginAnnouncement({
        status: "error",
        addressError: "",
        failure: "Too many attempts.",
        address: "ada@example.com",
      }),
      "Too many attempts.\nTry again, or use another address.",
    );
    assert.equal(
      loginAnnouncement({
        status: "error",
        addressError: "",
        failure: "",
        address: "ada@example.com",
      }),
      "Try again, or use another address.",
    );
  });

  it("says nothing while the form is quiet", () => {
    assert.equal(
      loginAnnouncement({
        status: "idle",
        addressError: "",
        failure: "We could not send the link.",
        address: "ada@example.com",
      }),
      "",
    );
    assert.equal(
      loginAnnouncement({
        status: "sending",
        addressError: "",
        failure: "We could not send the link.",
        address: "ada@example.com",
      }),
      "",
    );
  });

  it("feeds the live region from the same status, sentence, failure, and address", () => {
    const call = slice(form, "loginAnnouncement({", "});");

    expect(call).toMatch(/status,/);
    expect(call).toMatch(/addressError,/);
    expect(call).toMatch(/failure: message,/);
    expect(call).toMatch(/address: email,/);
    expect(call).not.toMatch(/devUrl|Use a different email/);
  });
});
