import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { MAX_CONTENT_LENGTH } from "./config.ts";
import {
  packNoteContent,
  readNoteComments,
  readNoteContent,
  withNoteComments,
} from "./note-blocks.ts";
import {
  duplicateNoteTitle,
  markdownDropChoice,
  markdownFileName,
  markdownImportTitle,
  markdownTextError,
  noteExportMarkdown,
} from "./note-file.ts";

const colored = [
  {
    id: "p",
    type: "paragraph",
    props: { textColor: "red", backgroundColor: "blue" },
    content: [{ type: "text", text: "Hello", styles: {} }],
    children: [],
  },
];

describe("markdown import and export", () => {
  it("names an imported note from the file and rejects a drop that is not markdown", () => {
    assert.equal(markdownImportTitle("Weekly plan.md"), "Weekly plan");
    assert.equal(markdownImportTitle("WEEKLY.MD"), "WEEKLY");
    assert.equal(markdownImportTitle(".md"), "Untitled note");
    assert.deepEqual(markdownDropChoice([]), { status: "ignore" });
    assert.deepEqual(markdownDropChoice([{ name: "photo.png", size: 20 }]), {
      status: "error",
      message: "Drop a Markdown file.",
    });
    assert.equal(markdownDropChoice([{ name: "empty.md", size: 0 }]).status, "error");
    assert.equal(
      markdownDropChoice([{ name: "huge.md", size: MAX_CONTENT_LENGTH + 1 }]).status,
      "error",
    );
    assert.deepEqual(
      markdownDropChoice([
        { name: "photo.png", size: 20 },
        { name: "Plan.md", size: 12 },
      ]),
      { status: "ready", index: 1, title: "Plan" },
    );
    assert.equal(markdownTextError("   "), "That Markdown file is empty.");
    assert.equal(
      markdownTextError("x".repeat(MAX_CONTENT_LENGTH + 1)),
      "That Markdown file is too large.",
    );
    assert.equal(markdownTextError("# Hello"), null);
  });

  it("downloads the note body without color snapshots or comments", () => {
    const stored = withNoteComments(packNoteContent("Hello\n\n", colored), {
      p: "Beside the paragraph",
    });

    assert.equal(noteExportMarkdown(stored), "Hello\n\n");
    assert.equal(noteExportMarkdown(stored).includes("pamiac-block"), false);
    assert.equal(readNoteComments(stored).p, "Beside the paragraph");
    assert.equal(readNoteContent(stored).blocks?.[0]?.props.textColor, "red");
    assert.equal(markdownFileName("Q3 / plan: notes"), "Q3 plan notes.md");
    assert.equal(markdownFileName("   "), "note.md");
  });

  it("titles a duplicate as a copy and keeps the copy title within the limit", () => {
    assert.equal(duplicateNoteTitle("Meeting"), "Meeting copy");
    assert.equal(duplicateNoteTitle("  "), "Untitled note copy");
    assert.equal(duplicateNoteTitle("n".repeat(160)).length, 160);
    assert.equal(duplicateNoteTitle("n".repeat(160)).endsWith(" copy"), true);
  });
});

describe("note comments stay beside the markdown", () => {
  it("reloads a comment and hides it from the markdown body", () => {
    const stored = withNoteComments("See [[Other]]\n\n", { block: "A short comment" });

    assert.equal(readNoteComments(stored).block, "A short comment");
    assert.equal(readNoteContent(stored).markdown, "See [[Other]]\n\n");
    assert.equal(readNoteContent(stored).markdown.includes("pamiac-block-comments"), false);
  });

  it("drops an empty comment and ignores a marker that is part of the note", () => {
    const stored = withNoteComments("Body\n\n", { block: "   " });
    const written = "Remember <!-- pamiac-block-comments abc --> for later";

    assert.equal(stored, "Body\n\n");
    assert.deepEqual(readNoteComments(written), {});
    assert.equal(readNoteContent(written).markdown, written);
  });
});

describe("note file controls", () => {
  it("imports on the library dashboard, exports from the open note, and duplicates a private copy", () => {
    const dashboard = readFileSync(
      new URL("../components/library/library-dashboard.tsx", import.meta.url),
      "utf8",
    );
    const drop = readFileSync(
      new URL("../components/library/library-markdown-drop.tsx", import.meta.url),
      "utf8",
    );
    const duplicate = readFileSync(
      new URL("../components/library/document-duplicate.tsx", import.meta.url),
      "utf8",
    );
    const menu = readFileSync(
      new URL("../components/library/document-menu-panel.tsx", import.meta.url),
      "utf8",
    );
    const note = readFileSync(
      new URL("../components/document/note-document.tsx", import.meta.url),
      "utf8",
    );
    const shareMarkdown = readFileSync(
      new URL("../components/note/note-share-markdown.tsx", import.meta.url),
      "utf8",
    );
    const editor = readFileSync(new URL("../components/note-editor.tsx", import.meta.url), "utf8");
    const drag = readFileSync(
      new URL("../components/note/note-drag-handle-menu.tsx", import.meta.url),
      "utf8",
    );

    assert.match(dashboard, /<LibraryMarkdownDrop workspaceId=\{workspaceId\}>/);
    assert.match(drop, /method: "POST"/);
    assert.match(drop, /\/api\/documents/);
    assert.match(drop, /method: "PATCH"/);
    assert.match(drop, /router\.push\(`\/d\/\$\{id\}`\)/);
    assert.match(note, /<NoteShareMarkdown/);
    assert.match(shareMarkdown, /<NoteExport/);
    assert.ok(shareMarkdown.indexOf("<NoteExport") < shareMarkdown.indexOf("<NoteImport"));
    assert.match(editor, /linkifyWikiBlocks/);
    assert.match(editor, /withNoteComments/);
    assert.match(editor, /return packNoteContent\(marked, editor\.document\)/);
    assert.ok(drag.indexOf("Copy link to block") < drag.indexOf("<NoteCommentMenu />"));
    assert.ok(drag.indexOf("<NoteCommentMenu />") < drag.indexOf("delete_menuitem"));
    assert.match(menu, /item\.type === "note" \?/);
    assert.match(duplicate, /duplicateNoteTitle/);
    assert.match(duplicate, /method: "PATCH"/);
    assert.equal(/visibility|password|emails/.test(duplicate), false);
  });
});
