import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { readStylesheet } from "./stylesheet.ts";
import {
  applyThemeChoice,
  dataThemeAttribute,
  readThemeChoice,
  resolvedScheme,
  themeChoiceFromStorage,
  themeInitScript,
  themeStorageKey,
  writeThemeChoice,
} from "./theme.ts";

function mediaBlock(source: string, query: string) {
  const header = `@media ${query}`;
  const at = source.indexOf(header);
  assert.ok(at >= 0, header);
  const open = source.indexOf("{", at);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    const character = source[index];
    if (character === "{") depth += 1;
    else if (character === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, index);
    }
  }
  assert.fail(`unclosed ${header}`);
}

function declarations(block: string) {
  return block
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");
}

function ruleBody(source: string, header: string) {
  const at = source.indexOf(header);
  assert.ok(at >= 0, header);
  const open = source.indexOf("{", at);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    const character = source[index];
    if (character === "{") depth += 1;
    else if (character === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, index);
    }
  }
  assert.fail(`unclosed ${header}`);
}

describe("theme choice", () => {
  it("defaults missing and unknown storage to system", () => {
    assert.equal(themeChoiceFromStorage(null), "system");
    assert.equal(themeChoiceFromStorage(""), "system");
    assert.equal(themeChoiceFromStorage("sepia"), "system");
    assert.equal(themeChoiceFromStorage("light"), "light");
    assert.equal(themeChoiceFromStorage("dark"), "dark");
    assert.equal(themeChoiceFromStorage("system"), "system");
  });

  it("lets an explicit choice override the operating system", () => {
    assert.equal(resolvedScheme("light", true), "light");
    assert.equal(resolvedScheme("light", false), "light");
    assert.equal(resolvedScheme("dark", false), "dark");
    assert.equal(resolvedScheme("dark", true), "dark");
    assert.equal(resolvedScheme("system", true), "dark");
    assert.equal(resolvedScheme("system", false), "light");
  });

  it("keeps system off the document and writes light or dark onto it", () => {
    assert.equal(dataThemeAttribute("system"), null);
    assert.equal(dataThemeAttribute("light"), "light");
    assert.equal(dataThemeAttribute("dark"), "dark");
  });

  it("reads system when storage is missing or blocked", () => {
    const store = new Map<string, string>();
    const previous = globalThis.localStorage;
    globalThis.localStorage = {
      getItem(key: string) {
        return store.has(key) ? store.get(key)! : null;
      },
      setItem(key: string, value: string) {
        store.set(key, value);
      },
      removeItem(key: string) {
        store.delete(key);
      },
      clear() {
        store.clear();
      },
      key() {
        return null;
      },
      get length() {
        return store.size;
      },
    };
    try {
      assert.equal(readThemeChoice(), "system");
      store.set(themeStorageKey, "dark");
      assert.equal(readThemeChoice(), "dark");
      globalThis.localStorage.getItem = () => {
        throw new Error("blocked");
      };
      assert.equal(readThemeChoice(), "system");
    } finally {
      globalThis.localStorage = previous;
    }
  });

  it("persists a choice, applies it, and still applies when storage throws", () => {
    const attributes = new Map<string, string>();
    const store = new Map<string, string>();
    let events = 0;
    const previousDocument = globalThis.document;
    const previousStorage = globalThis.localStorage;
    const previousWindow = globalThis.window;
    globalThis.document = {
      documentElement: {
        setAttribute(name: string, value: string) {
          attributes.set(name, value);
        },
        removeAttribute(name: string) {
          attributes.delete(name);
        },
      },
    } as unknown as Document;
    globalThis.localStorage = {
      getItem(key: string) {
        return store.has(key) ? store.get(key)! : null;
      },
      setItem(key: string, value: string) {
        store.set(key, value);
      },
      removeItem(key: string) {
        store.delete(key);
      },
      clear() {
        store.clear();
      },
      key() {
        return null;
      },
      get length() {
        return store.size;
      },
    };
    globalThis.window = {
      dispatchEvent() {
        events += 1;
        return true;
      },
    } as unknown as Window & typeof globalThis;
    try {
      writeThemeChoice("dark");
      assert.equal(store.get(themeStorageKey), "dark");
      assert.equal(attributes.get("data-theme"), "dark");
      assert.equal(events, 1);
      writeThemeChoice("system");
      assert.equal(store.get(themeStorageKey), "system");
      assert.equal(attributes.has("data-theme"), false);
      globalThis.localStorage.setItem = () => {
        throw new Error("blocked");
      };
      applyThemeChoice("light");
      writeThemeChoice("light");
      assert.equal(attributes.get("data-theme"), "light");
      assert.equal(events, 3);
    } finally {
      globalThis.document = previousDocument;
      globalThis.localStorage = previousStorage;
      globalThis.window = previousWindow;
    }
  });

  it("applies an explicit choice before paint and leaves system on the operating system", () => {
    function applied(stored: string | null, fail = false) {
      const attributes = new Map<string, string>();
      const localStorage = {
        getItem() {
          if (fail) throw new Error("blocked");
          return stored;
        },
      };
      const document = {
        documentElement: {
          setAttribute(name: string, value: string) {
            attributes.set(name, value);
          },
          removeAttribute(name: string) {
            attributes.delete(name);
          },
        },
      };
      new Function("localStorage", "document", themeInitScript)(localStorage, document);
      return attributes.get("data-theme") ?? null;
    }

    assert.equal(applied("light"), "light");
    assert.equal(applied("dark"), "dark");
    assert.equal(applied("system"), null);
    assert.equal(applied(null), null);
    assert.equal(applied("sepia"), null);
    assert.equal(applied("dark", true), null);
    assert.match(
      themeInitScript,
      new RegExp(`localStorage.getItem\\(${JSON.stringify(themeStorageKey)}\\)`),
    );
  });
});

describe("theme surfaces", () => {
  it("uses the same warm dark tokens for an explicit dark choice and the dark scheme", () => {
    const css = readStylesheet();
    const media = ruleBody(
      mediaBlock(css, "(prefers-color-scheme: dark)"),
      ':root:not([data-theme="light"])',
    );
    const explicit = ruleBody(css, 'html[data-theme="dark"]');
    assert.equal(declarations(explicit), declarations(media));
  });

  it("keeps the account menu keyboard behavior and a labeled theme choice", () => {
    const menu = readFileSync(
      new URL("../components/header/profile-menu.tsx", import.meta.url),
      "utf8",
    );
    const panel = readFileSync(
      new URL("../components/header/profile-menu-panel.tsx", import.meta.url),
      "utf8",
    );
    const theme = readFileSync(
      new URL("../components/header/profile-theme.tsx", import.meta.url),
      "utf8",
    );
    const option = readFileSync(
      new URL("../components/header/profile-theme-option.tsx", import.meta.url),
      "utf8",
    );
    const boot = readFileSync(new URL("../components/theme-boot.tsx", import.meta.url), "utf8");

    assert.match(menu, /event\.key !== "Escape"/);
    assert.match(menu, /buttonRef\.current\?\.focus\(\)/);
    assert.match(menu, /rootRef\.current\?\.contains\(event\.target as Node\)/);
    assert.match(panel, /role="menu"/);
    assert.match(panel, /firstRef\.current\?\.focus\(\)/);
    assert.match(panel, /<ProfileTheme \/>/);
    assert.equal(/onClose/.test(theme + option), false);
    assert.match(theme, /role="radiogroup"/);
    assert.match(theme, />Theme</);
    assert.match(theme, /Light/);
    assert.match(theme, /Dark/);
    assert.match(theme, /System/);
    assert.match(theme, /ArrowRight/);
    assert.match(theme, /ArrowLeft/);
    assert.match(option, /aria-checked=\{selected\}/);
    assert.match(option, /role="radio"/);
    assert.match(boot, /applyThemeChoice\(readThemeChoice\(\)\)/);
  });
});
