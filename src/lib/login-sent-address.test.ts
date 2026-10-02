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

describe("sign-in sent address", () => {
  it("repeats the submitted address and points recovery at the quiet action", () => {
    const submit = slice(
      form,
      "async function sendMagicLink",
      "export function LoginMagicLinkForm",
    );
    const hint = slice(css, ".login-sent .hint {", "}");

    expect(submit).toMatch(/rememberSentLoginAddress\(email\)/);
    expect(submit).not.toMatch(/form\.reset/);
    expect(form).toMatch(/address=\{sent\.address\}/);
    expect(sent).toMatch(/We sent a link to \{address\}\.\s*<br \/>/);
    expect(sent).toMatch(
      /Check your inbox, then spam, then promotions,\s*<br \/>\s*and it can take a minute\./,
    );
    expect(sent).not.toMatch(/Email me a link/);
    expect(sent).not.toMatch(/aria-live/);
    expect(sent).not.toMatch(/sessionStorage|localStorage/);
    expect(hint).toMatch(/overflow-wrap:\s*anywhere/);
  });
});
