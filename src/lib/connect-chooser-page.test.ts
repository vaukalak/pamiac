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

  it("shows the picker on the tokens page and opens the selected platform in the dialog", () => {
    const manager = read("src/components/tokens/token-manager.tsx");
    const opener = read("src/components/tokens/token-connect-opener.tsx");
    const heading = read("src/components/tokens/token-heading.tsx");
    const view = read("src/components/tokens/token-view-setup.tsx");
    const dialog = read("src/components/tokens/connection-dialog.tsx");
    const panel = read("src/components/tokens/connection-dialog-panel.tsx");
    const chooser = read("src/components/connect/connect-chooser.tsx");
    const signedIn = read("src/components/connect/connect-agent-signed-in.tsx");
    const headingAt = manager.indexOf("<TokenHeading");
    const openerAt = manager.indexOf("<TokenConnectOpener />");
    const keysAt = manager.indexOf("<TokenKeys />");

    assert.ok(headingAt >= 0 && openerAt > headingAt && keysAt > openerAt);
    assert.doesNotMatch(manager, /ConnectChooser|ConnectionDialog|useState/);
    assert.match(opener, /className="token-connect"/);
    assert.match(opener, /<ConnectPicker onPlatform=\{setPlatformId\} \/>/);
    assert.match(opener, /<ConnectionDialog initialPlatformId=\{platformId\} onClose=\{/);
    assert.doesNotMatch(opener, /<button/);
    assert.doesNotMatch(heading, /TokenNewConnection|New connection/);
    assert.match(view, /View setup/);
    assert.match(view, /<ConnectionDialog onClose=\{/);
    assert.doesNotMatch(view, /initialPlatformId/);
    assert.match(dialog, /initialPlatformId\?: ConnectPlatformId/);
    assert.match(
      panel,
      /<ConnectChooser initialPlatformId=\{initialPlatformId\} onClose=\{onClose\} titleId=\{titleId\} \/>/,
    );
    assert.match(
      chooser,
      /initialPlatformId \? \{ kind: "platform", platformId: initialPlatformId \}/,
    );
    assert.match(signedIn, /<ConnectChooser \/>/);
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
    assert.match(
      css,
      /\.token-connect-picker \{\s*container: token-connect-picker \/ inline-size;/,
    );
    assert.match(
      css,
      /\.token-connect-grid \{\s*display: grid;\s*grid-template-columns: minmax\(0, 1fr\);/,
    );
    assert.match(
      css,
      /@container token-connect-picker \(min-width: 520px\) \{\s*\.token-connect-grid \{\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/,
    );
    assert.match(
      css,
      /@container token-connect-picker \(min-width: 760px\) \{\s*\.token-connect-grid \{\s*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/,
    );
    assert.doesNotMatch(css, /token-connect-card[^{]*\{[^}]*grid-column:\s*span/);
    assert.doesNotMatch(css, /@media \(max-width: 640px\) \{[^}]*\.token-connect-grid/);
    assert.match(
      css,
      /@media \(max-width: 640px\) \{\s*\.token-connect-columns,\s*\.token-connect-token-grid \{\s*grid-template-columns: 1fr;/,
    );
    assert.match(css, /\.library-shell \.token-connect-dialog \{\s*width: min\(660px, 100%\);/);
    assert.match(pageBlock, /margin-bottom: 22px;/);
    assert.doesNotMatch(pageBlock, /660px/);
    assert.match(
      css,
      /\.library-shell \.token-connect \.btn\.secondary:not\(\[aria-pressed="true"\]\),/,
    );
  });
});
