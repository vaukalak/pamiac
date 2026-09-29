import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const form = readFileSync(new URL("../components/login-form.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const member = readFileSync(
  new URL("../components/library/workspace-member-add.tsx", import.meta.url),
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

describe("sign-in email danger", () => {
  it("marks an empty address or one without @ only after a send attempt", () => {
    const rejected = slice(form, "const addressRejected", "useLayoutEffect");
    const invalid = slice(form, "setAttempted(true)", 'setStatus("sending")');
    const input = slice(form, "<input", "/>");
    const reset = slice(form, "function chooseDifferentEmail", "return (");

    expect(rejected).toMatch(/attempted && !email\.includes\("@"\)/);
    expect(form).toMatch(/useState\(false\)/);
    expect(invalid).toMatch(/setAttempted\(true\)/);
    expect(invalid).toMatch(/setStatus\("idle"\)/);
    expect(invalid).toMatch(/return;/);
    expect(invalid).not.toMatch(/setEmail\(/);
    expect(invalid).not.toMatch(/signIn\.magicLink/);
    expect(invalid).not.toMatch(/rememberSentLoginAddress/);
    expect(invalid).not.toMatch(/setStatus\("sent"\)/);
    expect(invalid).not.toMatch(/setStatus\("error"\)/);
    expect(input).toMatch(/aria-invalid=\{addressRejected\}/);
    expect(input).toMatch(/value=\{email\}/);
    expect(form).toMatch(/<form className="form-stack" noValidate onSubmit=\{onSubmit\}>/);
    expect(reset).toMatch(/setAttempted\(false\)/);
    expect(form).toMatch(
      /status === "error" && !addressRejected \? <LoginSendFailure happened=\{message\} \/> : null/,
    );
    expect(form).toMatch(/rememberSentLoginAddress\(email\)/);
    expect(member).not.toMatch(/aria-invalid/);
  });

  it("paints the sign-in email border and glow with danger, including while focused", () => {
    const danger = block(
      css,
      '.auth-door .auth-card input[type="email"][aria-invalid="true"],\n.auth-door .auth-card input[type="email"][aria-invalid="true"]:focus {',
    );
    const focus = block(css, "input:focus,\ntextarea:focus,\nselect:focus {");
    const sheet = block(css, '.auth-door .auth-card input[type="email"] {');

    expect(danger).toMatch(/border-color:\s*var\(--danger\)/);
    expect(danger).toMatch(/box-shadow:\s*0 0 0 3px color-mix\(in srgb, var\(--danger\)/);
    expect(danger).not.toMatch(/var\(--teal\)|var\(--focus\)/);
    expect(focus).toMatch(/border-color:\s*var\(--teal\)/);
    expect(focus).toMatch(/box-shadow:\s*var\(--focus\)/);
    expect(sheet).not.toMatch(/border:|box-shadow:|aria-invalid/);
    expect(css).not.toMatch(/workspace-person-email\[aria-invalid/);
  });
});
