import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  isMarkdownDocument,
  markdownPasteText,
  preparePastedMarkdown,
  vscodeClipboardIsMarkdown,
} from "./markdown-paste.ts";

const document = `# Notes

- one
- two

| a | b |
| --- | --- |
| 1 | 2 |
`;

test("a markdown document with headings, lists, and a table is detected", () => {
  assert.equal(isMarkdownDocument(document), true);
});

test("an ATX heading without a blank line is detected", () => {
  assert.equal(isMarkdownDocument("# Title\nBody"), true);
});

test("plain prose is not detected as markdown", () => {
  assert.equal(isMarkdownDocument("The river was wide and the afternoon stayed quiet."), false);
});

test("leading YAML front matter becomes a yaml code block and the body stays", () => {
  const prepared = preparePastedMarkdown("---\nname: x\n---\n\n# Title\n\nBody\n");
  assert.equal(prepared, "```yaml\nname: x\n```\n\n# Title\n\nBody\n");
});

test("front matter is unchanged when the text has none, and CRLF becomes LF", () => {
  assert.equal(preparePastedMarkdown("# Title\r\n\r\nBody"), "# Title\n\nBody");
  assert.equal(
    preparePastedMarkdown("---\r\nname: x\r\n---\r\n\r\n# Title"),
    "```yaml\nname: x\n```\n\n# Title",
  );
});

test("VS Code clipboard mode is markdown only for markdown and mdx", () => {
  assert.equal(vscodeClipboardIsMarkdown('{"mode":"markdown"}'), true);
  assert.equal(vscodeClipboardIsMarkdown('{"mode":"mdx","version":1}'), true);
  assert.equal(vscodeClipboardIsMarkdown('{"mode":"plaintext"}'), false);
  assert.equal(vscodeClipboardIsMarkdown("{"), false);
  assert.equal(vscodeClipboardIsMarkdown("not json"), false);
});

test("the note editor passes the markdown paste handler", () => {
  const editor = readFileSync(new URL("../components/note-editor.tsx", import.meta.url), "utf8");
  const paste = readFileSync(new URL("../components/note/note-paste.ts", import.meta.url), "utf8");
  assert.match(editor, /pasteHandler:\s*pasteNoteMarkdown/);
  assert.match(paste, /markdownPasteText/);
  assert.match(paste, /editor\.pasteMarkdown/);
});

test("single list, task, fence, quote, table, link, and emphasis lines are markdown", () => {
  for (const sample of [
    "- item",
    "* item",
    "+ item",
    "1. item",
    "- [ ] task",
    "- [x] done",
    "```\ncode\n```",
    "> quoted",
    "| a | b |\n| --- | --- |",
    "[site](https://example.com)",
    "![alt](https://example.com/a.png)",
    "say **bold** here",
    "say __bold__ here",
    "say *italic* here",
    "say _italic_ here",
    "say ~~gone~~ here",
    "say `code` here",
    "---",
    "---\nname: x\n---\n",
    "---\n\nJust a break and a paragraph.",
  ]) {
    assert.equal(isMarkdownDocument(sample), true, sample);
  }
});

test("prose that only resembles markdown stays plain", () => {
  for (const sample of [
    "See section 1. Then continue reading.",
    "Use 2 * 3 and move on.",
    "snake_case_name stays a word",
    "def __init__(self):\n    return None",
    "#Title without a space",
  ]) {
    assert.equal(isMarkdownDocument(sample), false, sample);
  }
});

test("a leading thematic break is not wrapped as YAML", () => {
  assert.equal(
    preparePastedMarkdown("---\n\nJust a break and a paragraph."),
    "---\n\nJust a break and a paragraph.",
  );
  assert.equal(
    preparePastedMarkdown("---\n\nA paragraph.\n\n---\n"),
    "---\n\nA paragraph.\n\n---\n",
  );
});

test("VS Code mode ignores a missing or non-string mode", () => {
  assert.equal(vscodeClipboardIsMarkdown("{}"), false);
  assert.equal(vscodeClipboardIsMarkdown('{"mode":1}'), false);
  assert.equal(vscodeClipboardIsMarkdown("null"), false);
  assert.equal(vscodeClipboardIsMarkdown('{"mode":"Markdown"}'), true);
});

function clipboard(types: string[], data: Record<string, string>) {
  return {
    types,
    get(type: string) {
      return data[type] ?? "";
    },
  };
}

test("paste inside a code block, a BlockNote copy, or files stays on the default handler", () => {
  const events = [
    clipboard(["text/plain"], { "text/plain": "# Title\nBody" }),
    clipboard(["blocknote/html", "text/html", "text/plain"], {
      "blocknote/html": "<div></div>",
      "text/plain": "# Title\nBody",
    }),
    clipboard(["Files", "text/plain"], { "text/plain": "# Title\nBody" }),
  ];

  assert.equal(markdownPasteText({ inCodeBlock: true, clipboard: events[0]! }), undefined);
  assert.equal(markdownPasteText({ inCodeBlock: false, clipboard: events[1]! }), undefined);
  assert.equal(markdownPasteText({ inCodeBlock: false, clipboard: events[2]! }), undefined);
});

test("markdown clipboard flavors are pasted as prepared markdown", () => {
  const cases = [
    {
      clipboard: clipboard(["text/markdown", "text/html", "text/plain"], {
        "text/markdown": "---\nname: x\n---\n\n# Title",
        "text/html": "<h1>Title</h1>",
        "text/plain": "Title",
      }),
      expected: "```yaml\nname: x\n```\n\n# Title",
    },
    {
      clipboard: clipboard(["vscode-editor-data", "text/plain"], {
        "vscode-editor-data": '{"mode":"markdown"}',
        "text/plain": "# Title\nBody",
      }),
      expected: "# Title\nBody",
    },
    {
      clipboard: clipboard(["text/html", "text/plain"], {
        "text/html": "<p># Title</p>",
        "text/plain": "# Title\nBody",
      }),
      expected: "# Title\nBody",
    },
    {
      clipboard: clipboard(["vscode-editor-data", "text/html", "text/plain"], {
        "vscode-editor-data": '{"mode":"plaintext"}',
        "text/html": "<pre>- [ ] task</pre>",
        "text/plain": "- [ ] task",
      }),
      expected: "- [ ] task",
    },
  ];

  for (const item of cases) {
    assert.equal(
      markdownPasteText({ inCodeBlock: false, clipboard: item.clipboard }),
      item.expected,
    );
  }
});

test("an editor copy wins over markdown, and an MDX buffer is pasted as markdown", () => {
  assert.equal(
    markdownPasteText({
      inCodeBlock: false,
      clipboard: clipboard(["blocknote/html", "text/markdown", "text/plain"], {
        "blocknote/html": "<div></div>",
        "text/markdown": "# Title",
        "text/plain": "# Title",
      }),
    }),
    undefined,
  );
  assert.equal(
    markdownPasteText({
      inCodeBlock: false,
      clipboard: clipboard(["vscode-editor-data", "text/plain"], {
        "vscode-editor-data": '{"mode":"mdx"}',
        "text/plain": "---\r\nname: x\r\n---\r\n\r\n# Title",
      }),
    }),
    "```yaml\nname: x\n```\n\n# Title",
  );
  assert.equal(
    markdownPasteText({
      inCodeBlock: false,
      clipboard: clipboard([], {}),
    }),
    undefined,
  );
});

test("plain prose and non-markdown VS Code copies use the default paste handler", () => {
  const events = [
    clipboard(["text/html", "text/plain"], {
      "text/html": "<p>Hello</p>",
      "text/plain": "Hello from a paragraph.",
    }),
    clipboard(["vscode-editor-data", "text/plain"], {
      "vscode-editor-data": '{"mode":"typescript"}',
      "text/plain": "const value = 1;",
    }),
  ];

  for (const item of events) {
    assert.equal(markdownPasteText({ inCodeBlock: false, clipboard: item }), undefined);
  }
});
