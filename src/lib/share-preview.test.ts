import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, describe, it } from "node:test";
import { serializeBlockMarkdown, type BlockMarkdownNode } from "./block-link.ts";
import { defaultTitle } from "./content.ts";
import { packNoteContent } from "./note-blocks.ts";
import {
  SHARE_APP_DESCRIPTION,
  SHARE_APP_TITLE,
  SHARE_EMPTY_NOTE,
  SHARE_EXCERPT_LENGTH,
  SHARE_GENERIC_TITLE,
  appShareTarget,
  documentShareTarget,
  noteShareExcerpt,
  shareImageAlt,
  sharePageMetadata,
  sharePreviewForId,
  sharePreviewFromDocument,
  sharePreviewLines,
  type ShareDocument,
  type SharePreview,
} from "./share-preview.ts";

const originalDatabaseUrl = process.env.DATABASE_URL;
const originalBaseUrl = process.env.BETTER_AUTH_URL;

function pageMetadata(preview: SharePreview, id = "doc-1") {
  return sharePageMetadata(preview, {
    url: `https://pamiac.com/d/${id}`,
    imagePath: `/d/${id}/share-card.png`,
  });
}

function restoreDatabaseUrl() {
  if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDatabaseUrl;
}

function note(title: string, content: string, visibility = "public"): ShareDocument {
  return { title, content, type: "note", visibility };
}

const marked = `# Ship the notes

A **bold** claim and a [shared link](https://pamiac.example/d/secret).

- First step
- Second step

> Quoted line

\`\`\`ts
const token = "agent";
\`\`\`
`;

describe("public note previews", () => {
  it("uses the note title and a plain-prose excerpt", () => {
    const preview = sharePreviewFromDocument(note("Ship the notes", marked));
    const metadata = pageMetadata(preview);
    const image = metadata.openGraph.images[0];

    assert.equal(preview.publicNote, true);
    assert.equal(preview.title, "Ship the notes");
    assert.equal(metadata.title, "Ship the notes");
    assert.equal(metadata.description, preview.description);
    assert.equal(metadata.openGraph.type, "article");
    assert.equal(metadata.openGraph.title, "Ship the notes");
    assert.equal(metadata.openGraph.description, preview.description);
    assert.equal(metadata.openGraph.siteName, SHARE_APP_TITLE);
    assert.notEqual(metadata.openGraph.title, metadata.openGraph.siteName);
    assert.equal(metadata.openGraph.url, "https://pamiac.com/d/doc-1");
    assert.equal(image.url, "https://pamiac.com/d/doc-1/share-card.png");
    assert.equal(new URL(image.url).pathname.endsWith(".png"), true);
    assert.equal(new URL(image.url).search, "");
    assert.equal(image.width, 1200);
    assert.equal(image.height, 630);
    assert.equal(metadata.twitter.card, "summary_large_image");
    assert.equal(metadata.twitter.title, "Ship the notes");
    assert.equal(metadata.twitter.description, preview.description);
    assert.deepEqual(metadata.twitter.images, [image.url]);
    assert.equal(shareImageAlt(preview), "Ship the notes");
    assert.equal(preview.description.includes("#"), false);
    assert.equal(preview.description.includes("**"), false);
    assert.equal(preview.description.includes("]("), false);
    assert.equal(preview.description.includes("```"), false);
    assert.equal(preview.description.includes("https://pamiac.example"), false);
    assert.match(preview.description, /Ship the notes/);
    assert.match(preview.description, /A bold claim and a shared link/);
    assert.match(preview.description, /First step/);
    assert.match(preview.description, /Second step/);
    assert.match(preview.description, /Quoted line/);
    assert.match(preview.description, /const token = "agent"/);
    assert.equal(preview.description.startsWith("-"), false);
    assert.equal(
      preview.lines.some((line) => line.kind === "heading" && line.text === "Ship the notes"),
      true,
    );
    assert.equal(
      preview.lines.some((line) => line.kind === "text" && line.text === "First step"),
      true,
    );
  });

  it("keeps heading levels and strips emphasis inside headings", () => {
    const lines = sharePreviewLines("## A *nested* heading\n\nParagraph");

    assert.deepEqual(lines[0], { kind: "heading", level: 2, text: "A nested heading" });
    assert.deepEqual(lines[1], { kind: "text", level: 0, text: "Paragraph" });
  });

  it("falls back to the untitled note title and an empty-note description", () => {
    const preview = sharePreviewFromDocument(note("   ", " \n\n "));

    assert.equal(preview.title, defaultTitle("note"));
    assert.equal(preview.title, "Untitled note");
    assert.equal(preview.description, SHARE_EMPTY_NOTE);
    assert.deepEqual(preview.lines, [{ kind: "text", level: 0, text: SHARE_EMPTY_NOTE }]);
    assert.equal(shareImageAlt(preview), "Untitled note");
  });

  it("caps the description at the excerpt length", () => {
    const preview = sharePreviewFromDocument(note("Long", "word ".repeat(120)));

    assert.ok(preview.description.length <= SHARE_EXCERPT_LENGTH);
    assert.equal(preview.description.endsWith("…"), true);
    assert.equal(preview.description.includes("\n"), false);
  });

  it("drops block markers and the color snapshot from the prose", () => {
    const saved = serializeBlockMarkdown([
      { id: "paragraph", markdown: "Visible sentence\n", children: [] } satisfies BlockMarkdownNode,
    ]);
    const packed = packNoteContent("# Painted\n\nVisible sentence", [
      {
        id: "block",
        type: "paragraph",
        props: { textColor: "teal", backgroundColor: "default" },
        children: [],
      },
    ]);

    assert.equal(noteShareExcerpt(saved).includes("<!--"), false);
    assert.match(noteShareExcerpt(saved), /Visible sentence/);
    assert.equal(noteShareExcerpt(packed).includes("pamiac-block-colors"), false);
    assert.match(noteShareExcerpt(packed), /Painted/);
    assert.match(noteShareExcerpt(packed), /Visible sentence/);
  });

  it("leaves identifiers intact while removing emphasis markers", () => {
    const excerpt = noteShareExcerpt("Use snake_case and `**literal**` stars");

    assert.match(excerpt, /snake_case/);
    assert.match(excerpt, /\*\*literal\*\*/);
    assert.equal(excerpt.includes("`"), false);
  });
});

describe("private share cards", () => {
  const secret = note("Secret title", "Secret body that must stay hidden");

  it("uses the generic card for every non-public note", () => {
    for (const visibility of ["private", "password", "emails", "Public"] as const) {
      const preview = sharePreviewFromDocument({ ...secret, visibility });
      assert.equal(preview.publicNote, false);
      assert.equal(preview.title, SHARE_APP_TITLE);
      assert.equal(preview.description, SHARE_APP_DESCRIPTION);
      assert.deepEqual(preview.lines, []);
      assert.equal(JSON.stringify(preview).includes("Secret"), false);
      const metadata = pageMetadata(preview);
      assert.equal(metadata.openGraph.type, "website");
      assert.equal(metadata.title, SHARE_APP_TITLE);
      assert.equal(metadata.openGraph.title, SHARE_GENERIC_TITLE);
      assert.equal(metadata.twitter.title, SHARE_GENERIC_TITLE);
      assert.equal(metadata.openGraph.siteName, SHARE_APP_TITLE);
      assert.notEqual(metadata.openGraph.title, metadata.openGraph.siteName);
      assert.equal(metadata.description, SHARE_APP_DESCRIPTION);
      assert.equal(metadata.openGraph.description, SHARE_APP_DESCRIPTION);
      assert.equal(JSON.stringify(metadata).includes("Secret"), false);
      assert.equal(shareImageAlt(preview), SHARE_APP_TITLE);
    }
  });

  it("hides diagrams, missing documents, and other types", () => {
    for (const document of [
      null,
      undefined,
      { ...secret, type: "diagram", visibility: "public" },
      { ...secret, type: "Note", visibility: "public" },
    ]) {
      const preview = sharePreviewFromDocument(document);
      assert.equal(preview.publicNote, false);
      assert.equal(preview.title, SHARE_APP_TITLE);
      assert.equal(preview.description, SHARE_APP_DESCRIPTION);
      assert.equal(JSON.stringify(preview).includes("Secret"), false);
    }
  });
});

describe("sharePreviewForId", () => {
  afterEach(() => {
    restoreDatabaseUrl();
  });

  it("does not read a document when the database is not configured", async () => {
    delete process.env.DATABASE_URL;
    let called = false;
    const preview = await sharePreviewForId("doc-1", async () => {
      called = true;
      return note("Secret title", "Secret body");
    });

    assert.equal(called, false);
    assert.equal(preview.title, SHARE_APP_TITLE);
    assert.equal(preview.description, SHARE_APP_DESCRIPTION);
  });

  it("returns the generic card when the read throws or the document is missing", async () => {
    process.env.DATABASE_URL = "postgres://example";
    const thrown = await sharePreviewForId("doc-1", async () => {
      throw new Error("Secret title leaked from the database");
    });
    const missing = await sharePreviewForId("doc-1", async () => null);

    assert.equal(thrown.publicNote, false);
    assert.equal(thrown.title, SHARE_APP_TITLE);
    assert.equal(JSON.stringify(thrown).includes("Secret"), false);
    assert.equal(missing.title, SHARE_APP_TITLE);
    assert.equal(missing.description, SHARE_APP_DESCRIPTION);
  });

  it("returns the public note when the reader finds one", async () => {
    process.env.DATABASE_URL = "postgres://example";
    let requested = "";
    const preview = await sharePreviewForId("doc-9", async (id) => {
      requested = id;
      return note("Visible", "Hello from the note");
    });

    assert.equal(requested, "doc-9");
    assert.equal(preview.publicNote, true);
    assert.equal(preview.title, "Visible");
    assert.match(preview.description, /Hello from the note/);
  });
});

describe("share targets", () => {
  afterEach(() => {
    if (originalBaseUrl === undefined) delete process.env.BETTER_AUTH_URL;
    else process.env.BETTER_AUTH_URL = originalBaseUrl;
  });

  it("uses the app base URL and a png path for the site card", () => {
    process.env.BETTER_AUTH_URL = "https://pamiac.com";
    const target = appShareTarget();
    const metadata = sharePageMetadata(sharePreviewFromDocument(null), target);

    assert.deepEqual(target, {
      url: "https://pamiac.com",
      imagePath: "/share-card.png",
    });
    assert.equal(metadata.title, SHARE_APP_TITLE);
    assert.equal(metadata.openGraph.url, "https://pamiac.com");
    assert.equal(metadata.openGraph.images[0].url, "https://pamiac.com/share-card.png");
    assert.deepEqual(metadata.twitter.images, ["https://pamiac.com/share-card.png"]);
  });

  it("uses the document URL and the same png for public and private links", () => {
    process.env.BETTER_AUTH_URL = "https://pamiac.com/";
    const target = documentShareTarget("note/id");

    assert.deepEqual(target, {
      url: "https://pamiac.com/d/note%2Fid",
      imagePath: "/d/note%2Fid/share-card.png",
    });
    assert.equal(new URL(target.imagePath, target.url).href.endsWith(".png"), true);
  });
});

describe("share wiring", () => {
  it("points metadata at png routes and keeps private notes off the note card", () => {
    const page = readFileSync(new URL("../app/d/[id]/page.tsx", import.meta.url), "utf8");
    const image = readFileSync(
      new URL("../components/share-preview/document-share-image.tsx", import.meta.url),
      "utf8",
    );
    const route = readFileSync(
      new URL("../app/d/[id]/share-card.png/route.ts", import.meta.url),
      "utf8",
    );
    const rootRoute = readFileSync(
      new URL("../app/share-card.png/route.ts", import.meta.url),
      "utf8",
    );
    const rootImage = readFileSync(
      new URL("../components/share-preview/app-share-image.tsx", import.meta.url),
      "utf8",
    );
    const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
    const response = readFileSync(
      new URL("../components/share-preview/share-image-response.tsx", import.meta.url),
      "utf8",
    );
    const metadataSource = readFileSync(new URL("./share-preview.ts", import.meta.url), "utf8");
    const config = readFileSync(new URL("../../next.config.ts", import.meta.url), "utf8");
    const loader = readFileSync(new URL("./load-share-preview.ts", import.meta.url), "utf8");

    assert.match(page, /export const dynamic = "force-dynamic"/);
    assert.match(page, /const \{ id \} = await params/);
    assert.match(page, /loadSharePreview\(id\)/);
    assert.match(
      page,
      /sharePageMetadata\(await loadSharePreview\(id\), documentShareTarget\(id\)\)/,
    );
    assert.equal(page.includes("notFound"), true);
    assert.doesNotMatch(page, /opengraph-image|twitter-image/);
    assert.match(image, /loadSharePreview\(id\)/);
    assert.match(image, /preview\.publicNote \?/);
    assert.match(image, /<NoteShareCard lines=\{preview\.lines\} title=\{preview\.title\} \/>/);
    assert.match(image, /<ShareCard \/>/);
    assert.match(image, /return shareImageResponse\(card\)/);
    assert.doesNotMatch(image, /notFound/);
    assert.match(route, /documentShareImage\(props\)/);
    assert.match(route, /export const dynamic = "force-dynamic"/);
    assert.doesNotMatch(
      route,
      /NoteShareCard|preview\.lines|document\.content|opengraph-image|twitter-image/,
    );
    assert.match(rootRoute, /appShareImage\(\)/);
    assert.doesNotMatch(rootRoute, /opengraph-image|twitter-image/);
    assert.match(rootImage, /return shareImageResponse\(<ShareCard \/>\)/);
    assert.doesNotMatch(rootImage, /NoteShareCard/);
    assert.match(layout, /metadataBase: new URL\(appBaseUrl\(\)\)/);
    assert.match(
      layout,
      /sharePageMetadata\(sharePreviewFromDocument\(null\), appShareTarget\(\)\)/,
    );
    assert.doesNotMatch(layout, /opengraph-image|twitter-image/);
    assert.match(metadataSource, /siteName: SHARE_APP_TITLE/);
    assert.match(
      metadataSource,
      /type: preview\.publicNote \? \("article" as const\) : \("website" as const\)/,
    );
    assert.match(metadataSource, /card: "summary_large_image" as const/);
    assert.match(metadataSource, /images: \[image\]/);
    assert.match(metadataSource, /images: \[imageUrl\]/);
    assert.match(response, /Content-Type", SHARE_IMAGE_CONTENT_TYPE/);
    assert.match(response, /Content-Disposition", 'inline; filename="share-card\.png"'/);
    assert.match(response, /width: SHARE_IMAGE_SIZE\.width/);
    assert.match(response, /height: SHARE_IMAGE_SIZE\.height/);
    assert.match(
      config,
      /htmlLimitedBots: new RegExp\(`\$\{HTML_LIMITED_BOT_UA_RE\.source\}\|TelegramBot`\)/,
    );
    assert.doesNotMatch(config, /\/\.\*\//);
    assert.match(loader, /getDocumentBundle\(id\)/);
    assert.match(loader, /sharePreviewForId/);
  });
});
