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

describe("sign-in sent return", () => {
  it("returns to an empty form without keeping the address or the sent step", () => {
    const reset = slice(form, "function chooseDifferentEmail", "const email");
    const sentCall = slice(form, "<LoginLinkSent", "/>");

    expect(reset).toMatch(/form\.reset\(\{ email: "" \}\)/);
    expect(reset).toMatch(/mutation\.reset\(\)/);
    expect(reset).toMatch(/setSent\(null\)/);
    expect(sentCall).toMatch(/onChooseDifferentEmail=\{chooseDifferentEmail\}/);
    expect(sentCall).toMatch(/address=\{sent\.address\}/);
    expect(sent).toMatch(/onClick=\{onChooseDifferentEmail\}/);
    expect(sent).toMatch(/type="button"/);
    expect(form).not.toMatch(/sessionStorage|localStorage/);
    expect(sent).not.toMatch(/sessionStorage|localStorage/);
  });
});
