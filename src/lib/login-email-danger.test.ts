import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const form = readFileSync(
  new URL("../components/login/login-magic-link-form.tsx", import.meta.url),
  "utf8",
);
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
    const message = slice(form, "function loginEmailMessage", "const loginResolver");
    const resolver = slice(form, "const loginResolver", "async function sendMagicLink");
    const submit = slice(form, "onSubmit={(values)", "}}");
    const reset = slice(form, "function chooseDifferentEmail", "const email");

    expect(message).toMatch(/email\.includes\("@"\)/);
    expect(message).toMatch(/email\.trim\(\) === ""/);
    expect(message).toMatch(/"Enter an email address\."/);
    expect(message).toMatch(/"That address needs an @\."/);
    expect(form).toMatch(/mode:\s*"onSubmit"/);
    expect(resolver).not.toMatch(/signIn\.magicLink|rememberSentLoginAddress/);
    expect(submit).toMatch(/mutation\.mutate\(values\.email\)/);
    expect(submit).not.toMatch(/rememberSentLoginAddress|setSent\(/);
    expect(reset).toMatch(/form\.reset\(\{ email: "" \}\)/);
    expect(form).toMatch(
      /mutation\.isError && !addressError \? <LoginSendFailure happened=\{message\} \/> : null/,
    );
    expect(form).toMatch(/rememberSentLoginAddress\(email\)/);
    expect(member).not.toMatch(/aria-invalid/);
  });

  it("paints the sign-in email border and glow with danger, including while focused", () => {
    const danger = block(
      css,
      '.home .home-sign-in-panel input[aria-invalid="true"],\n.home .home-sign-in-panel input[aria-invalid="true"]:focus {',
    );
    const focus = block(css, "input:focus,\ntextarea:focus,\nselect:focus {");
    const sheet = block(
      css,
      ".home .home-sign-in-panel input,\n.home .home-sign-in-panel textarea {",
    );

    expect(danger).toMatch(/border-color:\s*#ffb4ab/);
    expect(danger).toMatch(/box-shadow:\s*0 0 0 3px rgba\(255,\s*180,\s*171,\s*0\.35\)/);
    expect(danger).not.toMatch(/var\(--home-lime\)|var\(--teal\)|var\(--focus\)/);
    expect(focus).toMatch(/border-color:\s*var\(--teal\)/);
    expect(focus).toMatch(/box-shadow:\s*var\(--focus\)/);
    expect(sheet).not.toMatch(/box-shadow:|aria-invalid/);
    expect(css).not.toMatch(/workspace-person-email\[aria-invalid/);
  });
});
