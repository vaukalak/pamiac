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
  noteShareExcerpt,
  shareImageAlt,
  sharePageMetadata,
  sharePreviewForId,
  sharePreviewFromDocument,
  sharePreviewLines,
  type ShareDocument,
} from "./share-preview.ts";

const originalDatabaseUrl = process.env.DATABASE_URL;

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
    const metadata = sharePageMetadata(preview);

    assert.equal(preview.publicNote, true);
    assert.equal(preview.title, "Ship the notes");
    assert.equal(metadata.title, "Ship the notes");
    assert.equal(metadata.description, preview.description);
    assert.equal(metadata.openGraph.type, "article");
    assert.equal(metadata.openGraph.title, "Ship the notes");
    assert.equal(metadata.openGraph.description, preview.description);
    assert.equal(metadata.twitter.card, "summary_large_image");
    assert.equal(metadata.twitter.description, preview.description);
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
      const metadata = sharePageMetadata(preview);
      assert.equal(metadata.openGraph.type, "website");
      assert.equal(metadata.title, SHARE_APP_TITLE);
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

describe("share wiring", () => {
  it("keeps metadata and the image route on the same unauthenticated preview", () => {
    const page = readFileSync(new URL("../app/d/[id]/page.tsx", import.meta.url), "utf8");
    const image = readFileSync(
      new URL("../app/d/[id]/opengraph-image.tsx", import.meta.url),
      "utf8",
    );
    const twitter = readFileSync(
      new URL("../app/d/[id]/twitter-image.tsx", import.meta.url),
      "utf8",
    );
    const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
    const rootTwitter = readFileSync(new URL("../app/twitter-image.tsx", import.meta.url), "utf8");
    const loader = readFileSync(new URL("./load-share-preview.ts", import.meta.url), "utf8");

    assert.match(page, /export const dynamic = "force-dynamic"/);
    assert.match(page, /const \{ id \} = await params/);
    assert.match(page, /loadSharePreview\(id\)/);
    assert.match(page, /sharePageMetadata/);
    assert.equal(page.includes("notFound"), true);
    assert.match(image, /export const dynamic = "force-dynamic"/);
    assert.match(image, /loadSharePreview\(id\)/);
    assert.match(image, /shareImageAlt\(preview\)/);
    assert.match(image, /preview\.publicNote \?/);
    assert.match(image, /<ShareCard \/>/);
    assert.doesNotMatch(image, /notFound/);
    assert.match(twitter, /from "\.\/opengraph-image"/);
    assert.match(twitter, /generateImageMetadata/);
    assert.match(twitter, /export const dynamic = "force-dynamic"/);
    assert.match(twitter, /export const runtime = "nodejs"/);
    assert.doesNotMatch(twitter, /dynamic,\n/);
    assert.match(rootTwitter, /from "\.\/opengraph-image"/);
    assert.match(rootTwitter, /export const runtime = "nodejs"/);
    assert.doesNotMatch(rootTwitter, /runtime,/);
    assert.match(layout, /metadataBase: new URL\(appBaseUrl\(\)\)/);
    assert.match(layout, /siteName: SHARE_APP_TITLE/);
    assert.match(layout, /type: "website"/);
    assert.match(layout, /card: "summary_large_image"/);
    assert.match(loader, /getDocumentBundle\(id\)/);
    assert.match(loader, /sharePreviewForId/);
  });
});
