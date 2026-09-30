import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

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

describe("sign-in promotions", () => {
  it("names the address, then inbox, spam, and promotions, in two sentences", () => {
    const hint = slice(sent, '<Paragraph className="hint">', "</Paragraph>");
    const sentences = hint.match(/\./g) ?? [];

    expect(hint).toMatch(/We sent a link to \{address\}\./);
    expect(hint).toMatch(/inbox, then spam, then promotions/);
    expect(hint).toMatch(/it can take a minute\./);
    assert.equal(sentences.length, 2);
    expect(sent).toMatch(/Use a different email/);
    expect(sent).not.toMatch(/aria-live/);
    expect(sent).not.toMatch(/sessionStorage|localStorage/);
  });
});
