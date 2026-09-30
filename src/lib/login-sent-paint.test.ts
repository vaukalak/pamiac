import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  forgetSentLoginAddress,
  loginSentBootScript,
  rememberSentLoginAddress,
} from "./login-sent-memory.ts";

const memory = readFileSync(new URL("./login-sent-memory.ts", import.meta.url), "utf8");
const page = readFileSync(new URL("../app/login/page.tsx", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const form = readFileSync(new URL("../components/login-form.tsx", import.meta.url), "utf8");
const copy = readFileSync(
  new URL("../components/login/login-sign-in-copy.tsx", import.meta.url),
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

function withPaint(run: (store: Map<string, string>, marks: Map<string, string>) => void) {
  const store = new Map<string, string>();
  const marks = new Map<string, string>();
  const previousWindow = globalThis.window;
  const hadWindow = Object.prototype.hasOwnProperty.call(globalThis, "window");
  const previousDocument = globalThis.document;
  const hadDocument = Object.prototype.hasOwnProperty.call(globalThis, "document");
  const previousStorage = globalThis.sessionStorage;
  const hadStorage = Object.prototype.hasOwnProperty.call(globalThis, "sessionStorage");

  Object.assign(globalThis, {
    window: {
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
    sessionStorage: {
      getItem(key: string) {
        return store.get(key) ?? null;
      },
    },
    document: {
      documentElement: {
        setAttribute(name: string, value: string) {
          marks.set(name, value);
        },
        removeAttribute(name: string) {
          marks.delete(name);
        },
      },
    },
  });

  try {
    run(store, marks);
  } finally {
    if (hadWindow) globalThis.window = previousWindow;
    else delete globalThis.window;
    if (hadDocument) globalThis.document = previousDocument;
    else delete globalThis.document;
    if (hadStorage) globalThis.sessionStorage = previousStorage;
    else delete globalThis.sessionStorage;
  }
}

describe("sent login first paint", () => {
  it("marks the document from the same stored key before the sign-in card is parsed", () => {
    const script = loginSentBootScript();
    const literals = memory.match(/pamiac\.login\.sentAddress/g) ?? [];

    assert.equal(literals.length, 1);
    expect(script).toMatch(/sessionStorage\.getItem\("pamiac\.login\.sentAddress"\)/);
    expect(script).toMatch(/document\.documentElement\.setAttribute\("data-login-sent",""\)/);
    expect(page).not.toMatch(/pamiac\.login\.sentAddress/);
    expect(page).toMatch(
      /<script dangerouslySetInnerHTML=\{\{ __html: loginSentBootScript\(\) \}\} \/>/,
    );
    expect(page).not.toMatch(/beforeInteractive/);
    assert.ok(page.indexOf("loginSentBootScript()") < page.indexOf("<LoginForm"));
    expect(layout).toMatch(/suppressHydrationWarning/);
    expect(copy).toMatch(/className="login-sign-in-copy"/);
    expect(copy).toMatch(/title="Sign in or register"/);
    expect(form).toMatch(/<Form\.Context[\s\S]*className="form-stack"/);
    expect(block(css, ".login-sign-in-copy {")).toMatch(/display:\s*contents/);
    expect(
      block(
        css,
        "html[data-login-sent] .login-sign-in-copy,\nhtml[data-login-sent] .home-sign-in-panel form.form-stack {",
      ),
    ).toMatch(/display:\s*none/);
  });

  it("hides nothing on a first visit and clears the mark when the address is forgotten", () => {
    withPaint((store, marks) => {
      eval(loginSentBootScript());
      assert.equal(marks.has("data-login-sent"), false);

      rememberSentLoginAddress("ada@example.com");
      eval(loginSentBootScript());
      assert.equal(store.get("pamiac.login.sentAddress"), "ada@example.com");
      assert.equal(marks.get("data-login-sent"), "");

      forgetSentLoginAddress();
      assert.equal(store.has("pamiac.login.sentAddress"), false);
      assert.equal(marks.has("data-login-sent"), false);
    });
  });
});
