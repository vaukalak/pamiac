import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { loginSendFailureSentence } from "./login-send-failure.ts";

const form = readFileSync(new URL("../components/login-form.tsx", import.meta.url), "utf8");
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

describe("sign-in send failure", () => {
  it("says what happened and what to do when the server gives no sentence", () => {
    assert.equal(loginSendFailureSentence(undefined), "We could not send the link.");
    assert.equal(loginSendFailureSentence(null), "We could not send the link.");
    assert.equal(loginSendFailureSentence(""), "We could not send the link.");
    assert.equal(loginSendFailureSentence("   "), "We could not send the link.");
    assert.equal(loginSendFailureSentence(500), "We could not send the link.");
  });

  it("uses a short human sentence, then keeps the same next step", () => {
    assert.equal(loginSendFailureSentence("Too many attempts"), "Too many attempts.");
    assert.equal(loginSendFailureSentence("Too many attempts."), "Too many attempts.");
    assert.equal(
      loginSendFailureSentence("  Please wait 30 seconds.  "),
      "Please wait 30 seconds.",
    );
    expect(failure).toMatch(/\{happened\}/);
    expect(failure).toMatch(/Try again, or use another address\./);
    expect(failure).not.toMatch(/aria-live|aria-invalid|magic link/i);
  });

  it("hides a stack, a status code, and the words magic link", () => {
    const stack = "Error: send failed\n    at deliver (mail.ts:12:3)";
    assert.equal(loginSendFailureSentence(stack), "We could not send the link.");
    assert.equal(
      loginSendFailureSentence("at deliver (mail.ts:12:3)"),
      "We could not send the link.",
    );
    assert.equal(
      loginSendFailureSentence("Request failed with status code 500"),
      "We could not send the link.",
    );
    assert.equal(loginSendFailureSentence("500"), "We could not send the link.");
    assert.equal(
      loginSendFailureSentence("Could not send the magic link"),
      "We could not send the link.",
    );
    assert.equal(
      loginSendFailureSentence("The magiclink service is down."),
      "We could not send the link.",
    );
    assert.equal(
      loginSendFailureSentence('{"message":"Could not send the magic link"}'),
      "We could not send the link.",
    );
  });

  it("keeps the typed address and leaves the field valid after a failed request", () => {
    const thrown = slice(form, "} catch (error) {", "if (result.error)");
    const rejected = slice(form, "if (result.error)", "rememberSentLoginAddress");
    const input = slice(form, "<input", "/>");
    const copy = slice(form, "const addressError", "useLayoutEffect");

    expect(thrown).toMatch(/setStatus\("error"\)/);
    expect(thrown).toMatch(/loginSendFailureSentence\(/);
    expect(thrown).not.toMatch(/setEmail\(/);
    expect(thrown).not.toMatch(/aria-invalid|magic link/i);
    expect(rejected).toMatch(/setStatus\("error"\)/);
    expect(rejected).toMatch(/loginSendFailureSentence\(result\.error\.message\)/);
    expect(rejected).not.toMatch(/setEmail\(/);
    expect(rejected).not.toMatch(/rememberSentLoginAddress/);
    expect(input).toMatch(/aria-invalid=\{addressRejected\}/);
    expect(input).toMatch(/value=\{email\}/);
    expect(input).not.toMatch(/status === "error"/);
    expect(copy).toMatch(/"Enter an email address\."/);
    expect(copy).toMatch(/"That address needs an @\."/);
    expect(form).toMatch(/aria-live="polite"/);
    expect(form).not.toMatch(/aria-live="assertive"/);
    expect(failure).not.toMatch(/aria-live/);
  });

  it("paints the send failure with danger, ahead of the card paragraph color", () => {
    const sentence = block(css, ".sign-in .feature p.error {");
    const card = block(css, ".auth-card p {");

    expect(sentence).toMatch(/color:\s*var\(--danger\)/);
    expect(sentence).not.toMatch(/aria-live|var\(--ink-soft\)/);
    expect(card).toMatch(/color:\s*var\(--ink-soft\)/);
    expect(failure).toMatch(/className="error"/);
  });
});
