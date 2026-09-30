import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const form = readFileSync(new URL("../components/login-form.tsx", import.meta.url), "utf8");
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

describe("sign-in email sentence", () => {
  it("writes the problem under the box and points the input at that sentence", () => {
    const copy = slice(form, "const addressError", "useLayoutEffect");
    const field = slice(form, '<label htmlFor="email">Email</label>', "</div>");
    const input = slice(field, "<input", "/>");
    const sentence = slice(field, "{addressError ?", ": null}");
    const invalid = slice(form, "setAttempted(true)", 'setStatus("sending")');

    expect(copy).toMatch(/!addressRejected/);
    expect(copy).toMatch(/email\.trim\(\) === ""/);
    expect(copy).toMatch(/"Enter an email address\."/);
    expect(copy).toMatch(/"That address needs an @\."/);
    expect(input).toMatch(/aria-invalid=\{addressRejected\}/);
    expect(input).toMatch(/aria-describedby=\{addressError \? "login-email-error" : undefined\}/);
    expect(input).toMatch(/value=\{email\}/);
    expect(sentence).toMatch(/<p id="login-email-error" className="login-email-error">/);
    expect(sentence).toMatch(/\{addressError\}/);
    expect(sentence).not.toMatch(/aria-live|role="alert"|role="status"/);
    assert.ok(field.indexOf("/>") < field.indexOf('<p id="login-email-error"'));
    expect(invalid).not.toMatch(/setEmail\(/);
    expect(form).toMatch(/aria-live="polite"/);
    expect(form).not.toMatch(/aria-live="assertive"/);
    expect(form).toMatch(
      /status === "error" && !addressRejected \?\s*(?:\(\s*)?<LoginSendFailure happened=\{message\} \/>\s*(?:\)\s*)?: null/,
    );
  });

  it("paints that sentence with danger, ahead of the card paragraph color", () => {
    const sentence = block(css, ".sign-in .feature p.login-email-error {");
    const card = block(css, ".auth-card p {");

    expect(sentence).toMatch(/color:\s*var\(--danger\)/);
    expect(sentence).toMatch(/margin:\s*8px 0 0/);
    expect(sentence).not.toMatch(/aria-live|var\(--ink-soft\)|var\(--teal\)/);
    expect(card).toMatch(/color:\s*var\(--ink-soft\)/);
  });
});
