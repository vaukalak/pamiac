import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { excerpt } from "./embeddings.ts";
import { noteMarkdown, packNoteContent, readNoteContent, type NoteBlock } from "./note-blocks.ts";

function block(
  id: string,
  props: Record<string, unknown>,
  children: NoteBlock[] = [],
  text = "Hello",
): NoteBlock {
  return {
    id,
    type: "paragraph",
    props,
    content: [{ type: "text", text, styles: {} }],
    children,
  };
}

const markdown = "Hello\n\n";

describe("note block colors", () => {
  it("persists text color and background color together", () => {
    const blocks = [block("p", { textColor: "red", backgroundColor: "blue" })];
    const stored = packNoteContent(markdown, blocks);
    const loaded = readNoteContent(stored);

    assert.equal(loaded.markdown, markdown);
    assert.deepEqual(loaded.blocks, blocks);
    assert.equal(loaded.blocks?.[0].props.textColor, "red");
    assert.equal(loaded.blocks?.[0].props.backgroundColor, "blue");
  });

  it("persists a text color when the background stays default", () => {
    const blocks = [block("p", { textColor: "purple", backgroundColor: "default" })];
    const loaded = readNoteContent(packNoteContent(markdown, blocks));

    assert.equal(loaded.blocks?.[0].props.textColor, "purple");
    assert.equal(loaded.blocks?.[0].props.backgroundColor, "default");
  });

  it("persists a background color when the text color stays default", () => {
    const blocks = [block("p", { textColor: "default", backgroundColor: "yellow" })];
    const loaded = readNoteContent(packNoteContent(markdown, blocks));

    assert.equal(loaded.blocks?.[0].props.textColor, "default");
    assert.equal(loaded.blocks?.[0].props.backgroundColor, "yellow");
  });

  it("persists a nested block color without recoloring its parent", () => {
    const blocks = [
      block("parent", { textColor: "default", backgroundColor: "default" }, [
        block("child", { textColor: "green", backgroundColor: "pink" }, [], "Nested"),
      ]),
    ];
    const loaded = readNoteContent(packNoteContent(markdown, blocks));

    assert.equal(loaded.blocks?.[0].props.textColor, "default");
    assert.equal(loaded.blocks?.[0].props.backgroundColor, "default");
    assert.equal(loaded.blocks?.[0].children?.[0].props.textColor, "green");
    assert.equal(loaded.blocks?.[0].children?.[0].props.backgroundColor, "pink");
  });

  it("keeps an arbitrary color string, not only palette names", () => {
    const blocks = [block("p", { textColor: "#aa3300", backgroundColor: "rgb(1, 2, 3)" })];
    const loaded = readNoteContent(packNoteContent(markdown, blocks));

    assert.deepEqual(loaded.blocks, blocks);
  });

  it("round-trips unicode block text inside the snapshot", () => {
    const blocks = [block("p", { textColor: "red", backgroundColor: "blue" }, [], "Колер 颜色")];
    const loaded = readNoteContent(packNoteContent("Колер\n\n", blocks));

    assert.equal((loaded.blocks?.[0].content as [{ text: string }])[0].text, "Колер 颜色");
  });

  it("leaves markdown unchanged when both colors are default", () => {
    const blocks = [block("p", { textColor: "default", backgroundColor: "default" })];
    const stored = packNoteContent(markdown, blocks);

    assert.equal(stored, markdown);
    assert.equal(readNoteContent(stored).blocks, null);
  });

  it("drops the snapshot when the markdown no longer matches", () => {
    const blocks = [block("p", { textColor: "red", backgroundColor: "blue" })];
    const stored = packNoteContent(markdown, blocks);
    const edited = stored.replace("Hello", "Goodbye");
    const loaded = readNoteContent(edited);

    assert.equal(loaded.blocks, null);
    assert.equal(loaded.markdown.includes("Goodbye"), true);
    assert.equal(loaded.markdown.includes("pamiac-block-colors"), false);
  });

  it("ignores a corrupt trailing snapshot and keeps the markdown", () => {
    const stored = `${markdown}<!-- pamiac-block-colors not-valid-base64 -->`;
    const loaded = readNoteContent(stored);

    assert.equal(loaded.blocks, null);
    assert.equal(loaded.markdown, markdown);
    assert.equal(noteMarkdown(stored), markdown);
  });

  it("does not treat a marker written in the note body as a snapshot", () => {
    const content = "Remember <!-- pamiac-block-colors abc --> for later\n\nNext";
    const loaded = readNoteContent(content);

    assert.equal(loaded.blocks, null);
    assert.equal(loaded.markdown, content);
    assert.equal(noteMarkdown(content), content);
  });

  it("still restores colors when a trailing newline follows the snapshot", () => {
    const blocks = [block("p", { textColor: "orange", backgroundColor: "gray" })];
    const stored = `${packNoteContent(markdown, blocks)}\n`;
    const loaded = readNoteContent(stored);

    assert.deepEqual(loaded.blocks, blocks);
  });

  it("hides the snapshot from note text, preview, and search text", () => {
    const blocks = [block("p", { textColor: "red", backgroundColor: "blue" }, [], "Painted")];
    const stored = packNoteContent("Painted\n\n", blocks);
    const content = readFileSync(new URL("./content.ts", import.meta.url), "utf8");
    const text = excerpt(noteMarkdown(stored), 140);

    assert.equal(noteMarkdown(stored), "Painted\n\n");
    assert.equal(text, "Painted");
    assert.equal(text.includes("pamiac-block-colors"), false);
    assert.match(content, /readableBlockMarkdown\(noteMarkdown\(content\)\)/);
    assert.match(content, /excerpt\(readableBlockMarkdown\(noteMarkdown\(content\)\), 140\)/);
    assert.equal(noteMarkdown("Plain note"), "Plain note");
  });

  it("keeps an existing markdown note readable when it has no snapshot", () => {
    const loaded = readNoteContent("# Title\n\nBody");

    assert.equal(loaded.blocks, null);
    assert.equal(loaded.markdown, "# Title\n\nBody");
    assert.equal(noteMarkdown("# Title\n\nBody"), "# Title\n\nBody");
  });

  it("saves and reloads block colors through the note editor", () => {
    const noteEditor = readFileSync(
      new URL("../components/note-editor.tsx", import.meta.url),
      "utf8",
    );

    assert.match(noteEditor, /return packNoteContent\(marked, editor\.document\)/);
    assert.match(noteEditor, /readNoteContent\(markdown \|\| ""\)/);
    assert.match(noteEditor, /note\.blocks/);
    assert.match(
      noteEditor,
      /editor\.replaceBlocks\(editor\.document, blocks as typeof editor\.document\)/,
    );
  });
});
