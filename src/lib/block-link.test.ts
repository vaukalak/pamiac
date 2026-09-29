import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  blockIdFromHash,
  blockPermalink,
  blocksFromMarkedMarkdown,
  copyToClipboard,
  markedMarkdownFromBlocks,
  parseBlockMarkdown,
  readableBlockMarkdown,
  serializeBlockMarkdown,
  type BlockMarkdownNode,
} from "./block-link.ts";

const paragraph = "Hello world\n";
const heading = "# Title\n";
const quote = "> A quote\n";
const list = "* item\n";

function node(id: string, markdown: string, children: BlockMarkdownNode[] = []): BlockMarkdownNode {
  return { id, markdown, children };
}

test("a block permalink replaces any hash with the block id", () => {
  assert.equal(blockPermalink("https://host/d/doc-1", "block-id"), "https://host/d/doc-1#block-id");
  assert.equal(
    blockPermalink("https://host/d/doc-1#old", "block-id"),
    "https://host/d/doc-1#block-id",
  );
  assert.equal(
    blockPermalink("https://host/d/doc-1?x=1#old", "block-id"),
    "https://host/d/doc-1?x=1#block-id",
  );
});

test("clipboard failure does not throw", async () => {
  let written = "";
  await copyToClipboard(
    async (value) => {
      written = value;
    },
    blockPermalink("https://host/d/doc-1#section", "block-id"),
  );
  assert.equal(written, "https://host/d/doc-1#block-id");

  await copyToClipboard(async () => {
    throw new Error("denied");
  }, "https://host/d/doc-1#block-id");
  await copyToClipboard(() => {
    throw new Error("missing");
  }, "https://host/d/doc-1#block-id");
});

test("notes without markers stay plain markdown", () => {
  for (const markdown of ["", "Hello world", "# Title\n\n> A quote", "<!-- note -->\nHello"]) {
    assert.equal(parseBlockMarkdown(markdown), null, JSON.stringify(markdown));
    assert.equal(readableBlockMarkdown(markdown), markdown);
  }
});

test("markers round-trip ids without becoming visible text", () => {
  const nodes = [
    node("paragraph", paragraph),
    node("heading", heading),
    node("quote", quote),
    node("list", list),
  ];
  const saved = serializeBlockMarkdown(nodes);

  assert.deepEqual(parseBlockMarkdown(saved), nodes);
  assert.match(saved, /<!--pamiac-block depth="0" id="paragraph"-->/);
  assert.equal(readableBlockMarkdown(saved), `${paragraph}${heading}${quote}${list}`);
  assert.equal(readableBlockMarkdown(saved).includes("<!--"), false);
  assert.equal(readableBlockMarkdown(`${paragraph}\n${heading}`), `${paragraph}\n${heading}`);
});

test("an empty block still stores its id and previews as an empty note", () => {
  const saved = serializeBlockMarkdown([node("block-id", "\n")]);

  assert.deepEqual(parseBlockMarkdown(saved), [node("block-id", "\n")]);
  assert.match(saved, /id="block-id"/);
  assert.equal(readableBlockMarkdown(saved).trim(), "");
  assert.equal(readableBlockMarkdown(""), "");
});

test("nested blocks keep their own ids and are not folded into the parent", () => {
  interface FakeBlock {
    id: string;
    text: string;
    children: FakeBlock[];
  }

  const blocks: FakeBlock[] = [
    {
      id: "parent",
      text: "* parent\n",
      children: [
        {
          id: "child",
          text: "* child\n",
          children: [{ id: "grand", text: "* grand\n", children: [] }],
        },
      ],
    },
  ];
  const seen: FakeBlock[] = [];
  const saved = markedMarkdownFromBlocks(blocks, (block) => {
    seen.push(block);
    return block.text;
  });
  const parsed = parseBlockMarkdown(saved);

  assert.deepEqual(
    seen.map((block) => block.children.length),
    [0, 0, 0],
  );
  assert.ok(parsed);
  assert.equal(parsed[0]?.markdown, "* parent\n");
  assert.equal(parsed[0]?.markdown.includes("child"), false);
  assert.equal(parsed[0]?.children[0]?.id, "child");
  assert.equal(parsed[0]?.children[0]?.markdown, "* child\n");
  assert.equal(parsed[0]?.children[0]?.children[0]?.id, "grand");
  assert.match(saved, /depth="0" id="parent"/);
  assert.match(saved, /depth="1" id="child"/);
  assert.match(saved, /depth="2" id="grand"/);

  const rebuilt = blocksFromMarkedMarkdown(parsed, (markdown) => [
    { id: "generated", text: markdown, children: [] },
  ]);
  assert.equal(rebuilt[0]?.id, "parent");
  assert.equal(rebuilt[0]?.children[0]?.id, "child");
  assert.equal(rebuilt[0]?.children[0]?.children[0]?.id, "grand");
  assert.equal(rebuilt[0]?.children[0]?.children[0]?.text, "* grand\n");
});

test("ids with reserved characters round-trip", () => {
  const nodes = [node("a/b c", "Hi\n")];
  assert.deepEqual(parseBlockMarkdown(serializeBlockMarkdown(nodes)), nodes);
});

test("a block that contains the marker text still round-trips", () => {
  const nodes = [node("a", 'See <!--pamiac-block depth="0" id="x"-->\n')];
  const saved = serializeBlockMarkdown(nodes);

  assert.deepEqual(parseBlockMarkdown(saved), nodes);
  assert.match(saved, /<!--\u200bpamiac-block /);
});

test("broken markers fall back to legacy markdown", () => {
  const broken = [
    '<!--pamiac-block depth="0" id="a"-->\nHi\n',
    '<!--pamiac-block depth="1" id="a"-->\nHi\n<!--/pamiac-block depth="1" id="a"-->\n',
    '<!--pamiac-block depth="0" id="a"-->\nHi\n<!--/pamiac-block depth="0" id="other"-->\n',
    `Hello\n${serializeBlockMarkdown([node("a", "Hi\n")])}`,
    `${serializeBlockMarkdown([node("a", "Hi\n")])}\nstill here`,
  ];

  for (const markdown of broken) {
    assert.equal(parseBlockMarkdown(markdown), null, markdown);
  }
});

test("only a persisted block id is taken from the hash", () => {
  const blocks = [{ id: "parent", children: [{ id: "child" }] }];

  assert.equal(blockIdFromHash("#child", blocks), "child");
  assert.equal(blockIdFromHash("#parent", blocks), "parent");
  assert.equal(blockIdFromHash("#missing", blocks), null);
  assert.equal(blockIdFromHash("#", blocks), null);
  assert.equal(blockIdFromHash("", blocks), null);
  assert.equal(blockIdFromHash("#%", blocks), null);
  assert.equal(blockIdFromHash("#child%20name", [{ id: "child name" }]), "child name");
});

test("opening a note does not publish, and copy uses the editor onChange path", () => {
  const noteEditor = readFileSync(
    new URL("../components/note-editor.tsx", import.meta.url),
    "utf8",
  );
  const copyLink = readFileSync(
    new URL("../components/note/copy-block-link.tsx", import.meta.url),
    "utf8",
  );
  const replaceAt = noteEditor.indexOf("editor.replaceBlocks");
  const readyAt = noteEditor.indexOf("ready.current = true");

  assert.ok(replaceAt !== -1 && readyAt !== -1 && replaceAt < readyAt);
  assert.match(noteEditor, /if \(!ready\.current \|\| !editable\) return/);
  assert.match(noteEditor, /parseBlockMarkdown/);
  assert.match(noteEditor, /tryParseMarkdownToBlocks/);
  assert.match(noteEditor, /bindNoteMarkdownPublisher/);
  assert.doesNotMatch(copyLink, /fetch\(/);
  assert.match(copyLink, /publishNoteMarkdown\(editor\)/);

  const content = readFileSync(new URL("./content.ts", import.meta.url), "utf8");
  assert.match(content, /readableBlockMarkdown\(content\)/);
  assert.equal(content.match(/readableBlockMarkdown\(content\)/g)?.length, 2);
});
