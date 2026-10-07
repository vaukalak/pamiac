import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, describe, it } from "node:test";
import { appBaseUrl } from "./config.ts";
import { robotsPolicy } from "./robots-policy.ts";
import {
  SHARE_APP_DESCRIPTION,
  SHARE_APP_TITLE,
  documentPageMetadata,
  sharePageMetadata,
  sharePreviewFromDocument,
  type ShareDocument,
} from "./share-preview.ts";
import { sitemapEntries } from "./sitemap-entries.ts";

const originalDatabaseUrl = process.env.DATABASE_URL;
const originalBaseUrl = process.env.BETTER_AUTH_URL;

function restoreEnv() {
  if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDatabaseUrl;
  if (originalBaseUrl === undefined) delete process.env.BETTER_AUTH_URL;
  else process.env.BETTER_AUTH_URL = originalBaseUrl;
}

function note(visibility: string, type = "note"): ShareDocument {
  return {
    title: "Secret title",
    content: "Secret body that must stay hidden",
    type,
    visibility,
  };
}

describe("robots", () => {
  afterEach(restoreEnv);

  it("allows public pages and disallows private, api, and well-known paths", () => {
    process.env.BETTER_AUTH_URL = "https://pamiac.com/";
    const body = robotsPolicy();
    const rules = Array.isArray(body.rules) ? body.rules[0] : body.rules;

    assert.equal(rules.userAgent, "*");
    assert.deepEqual(rules.allow, ["/", "/privacy", "/terms", "/support"]);
    assert.deepEqual(rules.disallow, [
      "/login",
      "/profile",
      "/workspace",
      "/oauth",
      "/connect",
      "/f/",
      "/api/",
      "/.well-known/",
      "/d/",
    ]);
    assert.equal(body.sitemap, "https://pamiac.com/sitemap.xml");
    assert.equal(body.host, appBaseUrl());
    assert.equal(body.host, "https://pamiac.com");
  });
});

describe("sitemap entries", () => {
  afterEach(restoreEnv);

  it("lists only the public marketing pages", () => {
    const entries = sitemapEntries("https://pamiac.com/");
    const urls = entries.map((entry) => entry.url);

    assert.deepEqual(urls, [
      "https://pamiac.com",
      "https://pamiac.com/privacy",
      "https://pamiac.com/terms",
      "https://pamiac.com/support",
    ]);
    assert.equal(
      urls.some((url) => /\/(d|f|workspace|api|login|oauth|connect)(\/|$)/.test(url)),
      false,
    );
  });

  it("ignores the database and never emits a document url", () => {
    process.env.DATABASE_URL = "postgres://example";
    const withDatabase = sitemapEntries("https://pamiac.com/");
    delete process.env.DATABASE_URL;
    const withoutDatabase = sitemapEntries("https://pamiac.com/");

    assert.deepEqual(withDatabase, withoutDatabase);
    assert.equal(JSON.stringify(withDatabase).includes("/d/"), false);
  });
});

describe("indexable metadata", () => {
  afterEach(restoreEnv);

  it("noindexes private notes, shared notes, and public diagrams", () => {
    process.env.BETTER_AUTH_URL = "https://pamiac.com";
    for (const document of [
      note("private"),
      note("password"),
      note("emails"),
      note("public", "diagram"),
      null,
    ]) {
      const metadata = documentPageMetadata(sharePreviewFromDocument(document), "doc-1");
      assert.deepEqual(metadata.robots, { index: false, follow: false });
      assert.deepEqual(metadata.title, { absolute: SHARE_APP_TITLE });
      assert.equal(metadata.description, SHARE_APP_DESCRIPTION);
      assert.equal(JSON.stringify(metadata).includes("Secret"), false);
    }
  });

  it("noindexes a public note and keeps its title, description, and canonical url", () => {
    process.env.BETTER_AUTH_URL = "https://pamiac.com";
    const metadata = documentPageMetadata(sharePreviewFromDocument(note("public")), "doc-1");

    assert.deepEqual(metadata.robots, { index: false, follow: false });
    assert.deepEqual(metadata.title, { absolute: "Secret title" });
    assert.match(metadata.description, /Secret body/);
    assert.equal(metadata.alternates.canonical, "https://pamiac.com/d/doc-1");
    assert.equal(metadata.openGraph.title, "Secret title");
    assert.equal(metadata.twitter.title, "Secret title");
  });

  it("leaves the home card indexable with the generic social title", () => {
    process.env.BETTER_AUTH_URL = "https://pamiac.com";
    const metadata = sharePageMetadata(sharePreviewFromDocument(null), {
      url: "https://pamiac.com",
      imagePath: "/share-card.png",
    });

    assert.equal(metadata.robots, undefined);
    assert.equal(metadata.title, SHARE_APP_TITLE);
    assert.equal(metadata.openGraph.title, "A shared mind for you and your agents.");
    assert.equal(metadata.alternates.canonical, "https://pamiac.com");
  });

  it("marks private routes noindex and leaves public pages indexable", () => {
    const privatePages = [
      "../app/login/page.tsx",
      "../app/profile/page.tsx",
      "../app/workspace/page.tsx",
      "../app/workspace/members/page.tsx",
      "../app/workspace/settings/page.tsx",
      "../app/workspace/tokens/page.tsx",
      "../app/oauth/consent/page.tsx",
      "../app/connect/google/page.tsx",
      "../app/connect/agent/page.tsx",
      "../app/f/[id]/page.tsx",
    ];
    for (const path of privatePages) {
      const source = readFileSync(new URL(path, import.meta.url), "utf8");
      assert.match(source, /privatePageRobots/);
    }

    const publicPages = [
      "../app/page.tsx",
      "../app/privacy/page.tsx",
      "../app/terms/page.tsx",
      "../app/support/page.tsx",
    ];
    for (const path of publicPages) {
      const source = readFileSync(new URL(path, import.meta.url), "utf8");
      assert.doesNotMatch(source, /privatePageRobots|index:\s*false/);
    }

    const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
    const home = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
    const spreadAt = layout.indexOf("...shareMetadata");
    const templateAt = layout.indexOf('template: "%s · Pamiac"');
    assert.equal(spreadAt > -1 && templateAt > spreadAt, true);
    assert.match(layout, /alternates: _homeCanonical/);
    assert.match(home, /canonical: appShareTarget\(\)\.url/);
    assert.doesNotMatch(home, /privatePageRobots|index:\s*false/);
    const privacy = readFileSync(new URL("../app/privacy/page.tsx", import.meta.url), "utf8");
    assert.match(privacy, /title: "Privacy policy"/);
    const documents = readFileSync(new URL("./documents.ts", import.meta.url), "utf8");
    assert.doesNotMatch(documents, /listPublicNoteIds/);
    const sitemapSource = readFileSync(new URL("../app/sitemap.ts", import.meta.url), "utf8");
    const robotsSource = readFileSync(new URL("../app/robots.ts", import.meta.url), "utf8");
    assert.match(sitemapSource, /export const revalidate = 3600/);
    assert.match(sitemapSource, /sitemapEntries\(appBaseUrl\(\)\)/);
    assert.doesNotMatch(sitemapSource, /listPublicNoteIds|sitemapForNotes|documents/);
    assert.match(robotsSource, /return robotsPolicy\(\)/);
  });
});
