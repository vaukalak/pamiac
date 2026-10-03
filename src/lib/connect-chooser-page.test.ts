import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { CONNECT_PLATFORMS, connectTokenName, platformFromClientId } from "./connect-platforms.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("connections page chooser", () => {
  it("lists Cursor, Claude, ChatGPT, Grok, Gemini Spark, then Other agent", () => {
    assert.deepEqual(
      CONNECT_PLATFORMS.map((platform) => [platform.id, platform.name, platform.recommended]),
      [
        ["cursor", "Cursor", false],
        ["claude", "Claude", false],
        ["chatgpt", "ChatGPT", false],
        ["grok", "Grok", false],
        ["gemini", "Gemini Spark", false],
        ["other", "Other agent", false],
      ],
    );
    assert.equal(CONNECT_PLATFORMS[0]?.blurb, "One click");
    assert.equal(connectTokenName("gemini"), "Gemini Spark on this computer");
    assert.equal(platformFromClientId("https://gemini.google.com/app"), "gemini");
    assert.equal(platformFromClientId("https://deepseek.com"), null);
  });

  it("shows the chooser on the tokens page and keeps View setup in the dialog", () => {
    const manager = read("src/components/tokens/token-manager.tsx");
    const heading = read("src/components/tokens/token-heading.tsx");
    const view = read("src/components/tokens/token-view-setup.tsx");
    const panel = read("src/components/tokens/connection-dialog-panel.tsx");
    const headingAt = manager.indexOf("<TokenHeading");
    const chooserAt = manager.indexOf("<ConnectChooser />");
    const keysAt = manager.indexOf("<TokenKeys />");

    assert.ok(headingAt >= 0 && chooserAt > headingAt && keysAt > chooserAt);
    assert.match(manager, /className="token-connect"/);
    assert.doesNotMatch(manager, /onClose|ConnectionDialog|share-backdrop|embedded/);
    assert.doesNotMatch(heading, /TokenNewConnection|New connection/);
    assert.match(view, /View setup/);
    assert.match(view, /<ConnectionDialog onClose=\{/);
    assert.match(panel, /<ConnectChooser onClose=\{onClose\} titleId=\{titleId\} \/>/);
    assert.throws(() => read("src/components/tokens/token-new-connection.tsx"));
    assert.throws(() => read("src/components/connect/connect-deepseek-setup.tsx"));
  });

  it("renames Gemini Spark copy and drops the DeepSeek connect surface", () => {
    const platforms = read("src/lib/connect-platforms.ts");
    const setup = read("src/components/connect/connect-gemini-setup.tsx");
    const branch = read("src/components/connect/connect-platform-setup.tsx");
    const mark = read("src/components/connect/connect-platform-mark.tsx");
    const css = read("src/app/globals.css");
    const pageBlock = css.slice(
      css.indexOf(".library-shell .library-main > .token-connect {"),
      css.indexOf(".library-shell .token-connect h3,"),
    );

    assert.match(platforms, /selfServe: "Let Gemini Spark configure itself"/);
    assert.doesNotMatch(platforms, /id: "deepseek"|DeepSeek|Recommended/);
    assert.match(setup, /Gemini Spark/);
    assert.doesNotMatch(setup, /\bGemini(?! Spark)\b/);
    assert.doesNotMatch(branch + mark, /deepseek|DeepSeek/);
    assert.doesNotMatch(css, /token-connect-mark-deepseek/);
    assert.match(css, /\.token-connect-card-cursor \{\s*grid-column: span 6;/);
    assert.match(css, /\.library-shell \.token-connect-dialog \{\s*width: min\(660px, 100%\);/);
    assert.match(pageBlock, /margin-bottom: 22px;/);
    assert.doesNotMatch(pageBlock, /660px/);
    assert.match(
      css,
      /\.library-shell \.token-connect \.btn\.secondary:not\(\[aria-pressed="true"\]\),/,
    );
  });
});
