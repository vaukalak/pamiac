import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { afterEach, describe, it } from "node:test";
import { HTML_LIMITED_BOT_UA_RE } from "next/dist/shared/lib/router/utils/html-bots.js";
import {
  SHARE_APP_DESCRIPTION,
  SHARE_APP_TITLE,
  SHARE_GENERIC_TITLE,
  SHARE_IMAGE_CONTENT_TYPE,
  documentShareTarget,
  sharePageMetadata,
  sharePreviewFromDocument,
  type ShareDocument,
} from "./share-preview.ts";

const require = createRequire(import.meta.url);
const loadConfig = require("next/dist/server/config").default;
const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");
const originalBaseUrl = process.env.BETTER_AUTH_URL;

function restoreBaseUrl() {
  if (originalBaseUrl === undefined) delete process.env.BETTER_AUTH_URL;
  else process.env.BETTER_AUTH_URL = originalBaseUrl;
}

describe("Telegram share card metadata", () => {
  afterEach(() => {
    restoreBaseUrl();
  });

  it("serves the same png for a public note and a private document", () => {
    process.env.BETTER_AUTH_URL = "https://pamiac.com";
    const target = documentShareTarget("doc-1");
    const secret: ShareDocument = {
      title: "Secret title",
      content: "Secret body that must stay hidden",
      type: "note",
      visibility: "private",
    };
    const visible: ShareDocument = {
      title: "Visible title",
      content: "Visible body",
      type: "note",
      visibility: "public",
    };
    const hidden = sharePageMetadata(sharePreviewFromDocument(secret), target);
    const shown = sharePageMetadata(sharePreviewFromDocument(visible), target);
    const imageUrl = "https://pamiac.com/d/doc-1/share-card.png";

    assert.equal(hidden.openGraph.url, shown.openGraph.url);
    assert.equal(hidden.openGraph.url, "https://pamiac.com/d/doc-1");
    assert.equal(hidden.openGraph.images[0].url, shown.openGraph.images[0].url);
    assert.equal(hidden.openGraph.images[0].url, imageUrl);
    assert.equal(hidden.openGraph.images[0].type, SHARE_IMAGE_CONTENT_TYPE);
    assert.deepEqual(hidden.twitter.images, [imageUrl]);
    assert.deepEqual(shown.twitter.images, [imageUrl]);
    assert.equal(new URL(imageUrl).protocol, "https:");
    assert.equal(new URL(imageUrl).search, "");
    assert.equal(hidden.title, SHARE_APP_TITLE);
    assert.equal(hidden.openGraph.title, SHARE_GENERIC_TITLE);
    assert.equal(hidden.openGraph.description, SHARE_APP_DESCRIPTION);
    assert.equal(shown.openGraph.title, "Visible title");
    assert.equal(JSON.stringify(hidden).includes("Secret"), false);
  });

  it("keeps Next's blocking-metadata bots and adds TelegramBot", async () => {
    const config = await loadConfig(
      PHASE_DEVELOPMENT_SERVER,
      new URL("../../", import.meta.url).pathname,
    );
    const source = String(config.htmlLimitedBots);
    const pattern = new RegExp(source, "i");

    assert.equal(source, `${HTML_LIMITED_BOT_UA_RE.source}|TelegramBot`);
    assert.notEqual(source, ".*");
    assert.equal(pattern.test("TelegramBot (like TwitterBot)"), true);
    assert.equal(pattern.test("facebookexternalhit/1.1"), true);
    assert.equal(pattern.test("Slackbot-LinkExpanding 1.0"), true);
    assert.equal(pattern.test("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"), false);
    assert.deepEqual(config.outputFileTracingIncludes["/share-card.png"], ["./assets/*.ttf"]);
    assert.deepEqual(config.outputFileTracingIncludes["/d/**/share-card.png"], ["./assets/*.ttf"]);
  });

  it("draws the png routes through the existing card response", () => {
    const documentImage = readFileSync(
      new URL("../components/share-preview/document-share-image.tsx", import.meta.url),
      "utf8",
    );
    const rootImage = readFileSync(
      new URL("../components/share-preview/app-share-image.tsx", import.meta.url),
      "utf8",
    );
    const documentRoute = readFileSync(
      new URL("../app/d/[id]/share-card.png/route.ts", import.meta.url),
      "utf8",
    );
    const rootRoute = readFileSync(
      new URL("../app/share-card.png/route.ts", import.meta.url),
      "utf8",
    );

    assert.match(documentImage, /return shareImageResponse\(card\)/);
    assert.match(rootImage, /return shareImageResponse\(<ShareCard \/>\)/);
    assert.match(documentRoute, /export const runtime = "nodejs"/);
    assert.match(rootRoute, /export const runtime = "nodejs"/);
    assert.doesNotMatch(documentRoute, /new ImageResponse|Content-Disposition/);
    assert.doesNotMatch(rootRoute, /new ImageResponse|Content-Disposition/);
    assert.equal(existsSync(new URL("../app/opengraph-image.tsx", import.meta.url)), false);
    assert.equal(existsSync(new URL("../app/twitter-image.tsx", import.meta.url)), false);
    assert.equal(existsSync(new URL("../app/d/[id]/opengraph-image.tsx", import.meta.url)), false);
    assert.equal(existsSync(new URL("../app/d/[id]/twitter-image.tsx", import.meta.url)), false);
  });
});
