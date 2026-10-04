import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { readStylesheet } from "./stylesheet.ts";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { maskTokenSecret } from "../components/tokens/token-secret-mask.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function expect(actual: unknown) {
  const text = String(actual);
  return {
    toBe(expected: unknown) {
      assert.equal(actual, expected);
    },
    toBeLessThan(expected: number) {
      assert.equal(typeof actual, "number");
      assert.ok(Number(actual) < expected, `${String(actual)} < ${expected}`);
    },
    toMatch(pattern: RegExp) {
      assert.match(text, pattern);
    },
    not: {
      toMatch(pattern: RegExp) {
        assert.doesNotMatch(text, pattern);
      },
    },
  };
}

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

function slice(source: string, start: string, end?: string) {
  const from = source.indexOf(start);
  assert.ok(from >= 0, start);
  if (!end) return source.slice(from);
  const to = source.indexOf(end, from + start.length);
  assert.ok(to > from, end);
  return source.slice(from, to);
}

describe("token secret masking", () => {
  it("keeps the pam_ prefix and the last two characters", () => {
    expect(maskTokenSecret("pam_abcKg")).toBe("pam_\u2022\u2022\u2022Kg");
    expect(maskTokenSecret("pam_somethingElse")).toBe("pam_\u2022\u2022\u2022se");
  });

  it("masks a secret that is too short to keep a hidden middle", () => {
    expect(maskTokenSecret("pam_Kg")).toBe("\u2022\u2022\u2022");
    expect(maskTokenSecret("pam_")).toBe("\u2022\u2022\u2022");
    expect(maskTokenSecret("ab")).toBe("\u2022\u2022\u2022");
    expect(maskTokenSecret("")).toBe("\u2022\u2022\u2022");
  });

  it("masks a value that does not start with pam_", () => {
    expect(maskTokenSecret("token_abcKg")).toBe("\u2022\u2022\u2022");
  });
});

describe("token secret copy and reveal", () => {
  it("starts masked and reveals the full secret from the same row", () => {
    const secret = read("src/components/tokens/token-secret.tsx");
    const row = read("src/components/tokens/token-secret-row.tsx");

    expect(secret).toMatch(/useState\(false\)/);
    expect(secret).toMatch(/Set PAMIAC_TOKEN to this value/);
    expect(row).toMatch(/visible \? secret : maskTokenSecret\(secret\)/);
    expect(row).toMatch(/<span className="secret-value">\{shown\}<\/span>/);
    expect(row).toMatch(/<TokenSecretCopy /);
    expect(row).toMatch(/<TokenSecretReveal /);
    expect(row.indexOf("<TokenSecretCopy ")).toBeLessThan(row.indexOf("<TokenSecretReveal "));
    expect(secret).not.toMatch(/<button[\s>]/);
    expect(row).not.toMatch(/<button[\s>]/);
  });

  it("copies the full secret and splits success from failure", () => {
    const secret = read("src/components/tokens/token-secret.tsx");
    const copy = read("src/components/tokens/token-secret-copy.tsx");
    const action = slice(copy, "async function copy", "return (");

    expect(copy).toMatch(/from "@\/ui\/Button"/);
    expect(copy).not.toMatch(/<button[\s>]/);
    expect(copy).toMatch(/className="login-announcement">Copy API key<\/span>/);
    expect(copy).not.toMatch(/aria-label/);
    expect(action.indexOf('onResult("")')).toBeLessThan(action.indexOf("writeText(secret)"));
    expect(action).toMatch(/navigator\.clipboard\.writeText\(secret\)/);
    expect(action).not.toMatch(/writeText\(shown\)|writeText\(maskTokenSecret/);
    expect(action).toMatch(/onResult\("Key copied\."\)/);
    expect(action).toMatch(/onResult\("Could not copy the key\."\)/);
    expect(secret).toMatch(
      /\{message === "Could not copy the key\." \? <Alert>\{message\}<\/Alert> : null\}/,
    );
    expect(secret).toMatch(
      /\{message === "Key copied\." \? \(\s*<p className="text-pretty" role="status">\s*\{message\}\s*<\/p>\s*\) : null\}/,
    );
    expect(secret).not.toMatch(/<Alert>\{message === "Key copied\."/);
  });

  it("names the reveal control and marks whether the key is visible", () => {
    const reveal = read("src/components/tokens/token-secret-reveal.tsx");

    expect(reveal).toMatch(/pressed=\{visible\}/);
    expect(reveal).toMatch(/\{visible \? "Hide API key" : "Reveal API key"\}/);
    expect(reveal).toMatch(/className="login-announcement"/);
    expect(reveal).not.toMatch(/aria-label/);
    expect(reveal).not.toMatch(/<button[\s>]/);
    expect(reveal).toMatch(/aria-hidden="true"/);
    expect(reveal).toMatch(/\{visible \? <path d="M2\.5 2\.5 13\.5 13\.5" \/> : null\}/);
  });

  it("keeps the icon buttons at the end of the secret row", () => {
    const css = readStylesheet();
    const row = slice(css, ".secret {", ".skill {");
    const library = slice(
      css,
      ".library-shell .token-secret .secret {",
      ".library-shell .token-secret .error {",
    );

    expect(row).toMatch(/display: flex;/);
    expect(row).toMatch(/\.secret-value \{[\s\S]*flex: 1 1 auto;/);
    expect(row).toMatch(/\.secret-value \{[\s\S]*word-break: break-all;/);
    expect(row).toMatch(/\.btn\.secret-icon \{[\s\S]*flex: 0 0 auto;/);
    expect(row).toMatch(/width: 32px;/);
    expect(row).toMatch(/height: 32px;/);
    expect(row).toMatch(/background: transparent;/);
    expect(row).toMatch(/color: var\(--secret-ink\);/);
    expect(row).toMatch(/\.btn\.secret-icon:focus-visible \{[\s\S]*outline: 2px solid/);
    expect(library).toMatch(/border-color: var\(--home-lime\);/);
    expect(library).toMatch(/color: var\(--home-lime\);/);
    expect(library).toMatch(/outline: 2px solid var\(--home-lime\);/);
  });
});
