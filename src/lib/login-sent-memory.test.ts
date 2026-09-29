import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  forgetSentLoginAddress,
  readSentLoginAddress,
  rememberSentLoginAddress,
} from "./login-sent-memory.ts";

const form = readFileSync(new URL("../components/login-form.tsx", import.meta.url), "utf8");
const sent = readFileSync(
  new URL("../components/login/login-link-sent.tsx", import.meta.url),
  "utf8",
);
const memory = readFileSync(new URL("./login-sent-memory.ts", import.meta.url), "utf8");

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

function withWindow(value: unknown, run: () => void) {
  const hadWindow = Object.prototype.hasOwnProperty.call(globalThis, "window");
  const previous = globalThis.window;
  Object.defineProperty(globalThis, "window", { configurable: true, value });
  try {
    run();
  } finally {
    if (hadWindow) {
      Object.defineProperty(globalThis, "window", { configurable: true, value: previous });
    } else {
      delete globalThis.window;
    }
  }
}

describe("sent login address memory", { concurrency: false }, () => {
  it("remembers one address for this tab and forgets it on request", () => {
    const store = new Map<string, string>();
    withWindow(
      {
        sessionStorage: {
          getItem(key: string) {
            return store.get(key) ?? null;
          },
          setItem(key: string, value: string) {
            store.set(key, value);
          },
          removeItem(key: string) {
            store.delete(key);
          },
        },
      },
      () => {
        assert.equal(readSentLoginAddress(), null);
        rememberSentLoginAddress("ada@example.com");
        assert.equal(readSentLoginAddress(), "ada@example.com");
        assert.equal(store.size, 1);
        rememberSentLoginAddress("grace@example.com");
        assert.equal(readSentLoginAddress(), "grace@example.com");
        assert.equal(store.size, 1);
        forgetSentLoginAddress();
        assert.equal(readSentLoginAddress(), null);
        assert.equal(store.size, 0);
      },
    );
  });

  it("does not remember an empty address or a failed storage call", () => {
    const store = new Map<string, string>();
    withWindow(
      {
        sessionStorage: {
          getItem(key: string) {
            return store.get(key) ?? null;
          },
          setItem(key: string, value: string) {
            store.set(key, value);
          },
          removeItem(key: string) {
            store.delete(key);
          },
        },
      },
      () => {
        rememberSentLoginAddress("ada@example.com");
        rememberSentLoginAddress("");
        assert.equal(readSentLoginAddress(), "ada@example.com");
      },
    );

    withWindow(
      {
        get sessionStorage() {
          throw new Error("blocked");
        },
      },
      () => {
        assert.equal(readSentLoginAddress(), null);
        rememberSentLoginAddress("ada@example.com");
        forgetSentLoginAddress();
      },
    );

    withWindow(
      {
        sessionStorage: {
          getItem() {
            throw new Error("blocked");
          },
          setItem() {
            throw new Error("quota");
          },
          removeItem() {
            throw new Error("blocked");
          },
        },
      },
      () => {
        assert.equal(readSentLoginAddress(), null);
        rememberSentLoginAddress("ada@example.com");
        forgetSentLoginAddress();
      },
    );
  });

  it("keeps the address out of localStorage, cookies, and the URL", () => {
    expect(memory).toMatch(/sessionStorage/);
    expect(memory).not.toMatch(/localStorage/);
    expect(memory).not.toMatch(/document\.cookie/);
    expect(memory).not.toMatch(/location|searchParams|history\.push/);
    expect(form).not.toMatch(/localStorage/);
    expect(form).not.toMatch(/document\.cookie/);
    expect(form).toMatch(/aria-live="polite"/);
    expect(sent).not.toMatch(/aria-live/);
  });

  it("restores a remembered address and forgets it only from the different-email action", () => {
    const restore = slice(form, "useLayoutEffect", "async function onSubmit");
    const beforeResult = slice(form, "async function onSubmit", "if (result.error)");
    const success = slice(form, "if (result.error)", "const dev");
    const errorBranch = success.slice(0, success.indexOf("return;"));
    const reset = slice(form, "function chooseDifferentEmail", "return (");

    expect(restore).toMatch(/readSentLoginAddress\(\)/);
    expect(restore).toMatch(/setEmail\(remembered\)/);
    expect(restore).toMatch(/setStatus\("sent"\)/);
    expect(beforeResult).not.toMatch(/rememberSentLoginAddress/);
    expect(errorBranch).not.toMatch(/rememberSentLoginAddress/);
    expect(success).toMatch(/rememberSentLoginAddress\(email\)/);
    expect(success).toMatch(/setStatus\("sent"\)/);
    expect(reset).toMatch(/forgetSentLoginAddress\(\)/);
    expect(reset).toMatch(/setEmail\(""\)/);
    expect(reset).toMatch(/setStatus\("idle"\)/);
    expect(sent).toMatch(/Use a different email/);
  });
});
