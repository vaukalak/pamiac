import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { readStylesheet } from "./stylesheet.ts";

const form = readFileSync(
  new URL("../components/login/login-magic-link-form.tsx", import.meta.url),
  "utf8",
);
const field = readFileSync(new URL("../ui/Form/Input.tsx", import.meta.url), "utf8");
const css = readStylesheet();

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
    const copy = slice(form, "function loginEmailMessage", "const loginResolver");
    const input = slice(field, "<input", "/>");
    const sentence = slice(field, "{message ?", ": null}");

    expect(copy).toMatch(/email\.includes\("@"\)/);
    expect(copy).toMatch(/email\.trim\(\) === ""/);
    expect(copy).toMatch(/"Enter an email address\."/);
    expect(copy).toMatch(/"That address needs an @\."/);
    expect(form).toMatch(/<Form\.Input[^>]*name="email"/);
    expect(input).toMatch(/aria-invalid=\{message \? true : undefined\}/);
    expect(input).toMatch(/aria-describedby=\{message \? errorId : undefined\}/);
    expect(field).toMatch(/const errorId = `\$\{name\}-error`/);
    expect(sentence).toMatch(/<Alert id=\{errorId\}>\{message\}<\/Alert>/);
    assert.ok(field.indexOf("<input") < field.indexOf("<Alert"));
    expect(form).toMatch(/aria-live="polite"/);
    expect(form).not.toMatch(/aria-live="assertive"/);
    expect(form).toMatch(
      /mutation\.isError && !addressError \? <LoginSendFailure happened=\{message\} \/> : null/,
    );
  });

  it("paints that sentence with the board error color, ahead of the panel copy", () => {
    const sentence = block(css, ".home .home-sign-in-panel .error {");
    const card = block(css, ".auth-card p {");

    expect(sentence).toMatch(/color:\s*var\(--home-danger\)/);
    expect(sentence).toMatch(/margin-top:\s*8px/);
    expect(sentence).not.toMatch(/aria-live|var\(--ink-soft\)|var\(--teal\)|var\(--home-lime\)/);
    expect(card).toMatch(/color:\s*var\(--ink-soft\)/);
  });
});
