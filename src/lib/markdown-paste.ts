const frontMatterPattern = /^---\n([\s\S]*?)\n---(?=\n|$)/;

const inlinePatterns = [
  /\*\*[^*\n]+\*\*/,
  /(?:^|[\s([{"'])__[^_\s][^_\n]*__(?=\s|[.,;:!?)}\]"']|$)/,
  /~~[^~\n]+~~/,
  /`[^`\n]+`/,
  /!\[[^\]\n]*\]\([^)\n]+\)/,
  /\[[^\]\n]+\]\([^)\n]+\)/,
  /(?:^|[\s([{"'])\*[^*\s](?:[^*\n]*[^*\s])?\*(?=\s|[.,;:!?)}\]"']|$)/,
  /(?:^|[\s([{"'])_[^_\s](?:[^_\n]*[^_\s])?_(?=\s|[.,;:!?)}\]"']|$)/,
];

function normalized(text: string) {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function frontMatter(source: string) {
  const match = frontMatterPattern.exec(source);
  if (!match) return null;

  const yaml = match[1] ?? "";
  const lines = yaml.split("\n").filter((line) => line.trim() !== "");
  const mapping = lines.every(
    (line) => /^[A-Za-z0-9_-]+\s*:/.test(line) || /^\s*-\s+\S/.test(line) || /^\s*#/.test(line),
  );
  if (!mapping || lines.length === 0) return null;

  return { yaml, rest: source.slice(match[0].length) };
}

function isMarkdownLine(line: string) {
  return (
    /^#{1,6} \S/.test(line) ||
    /^[ \t]{0,3}[-*+] \S/.test(line) ||
    /^[ \t]{0,3}\d+\. \S/.test(line) ||
    /^[ \t]{0,3}[-*+] \[[ xX]\] /.test(line) ||
    /^[ \t]{0,3}(`{3,}|~{3,})/.test(line) ||
    /^[ \t]{0,3}> /.test(line) ||
    /^[ \t]{0,3}\|.*\|[ \t]*$/.test(line) ||
    /^[ \t]{0,3}\|?[ \t]*:?-{3,}:?[ \t]*(?:\|[ \t]*:?-{3,}:?[ \t]*)+\|?[ \t]*$/.test(line) ||
    /^[ \t]{0,3}([-*_])\1{2,}[ \t]*$/.test(line)
  );
}

export function isMarkdownDocument(text: string) {
  const source = normalized(text);
  if (frontMatter(source)) return true;
  if (inlinePatterns.some((pattern) => pattern.test(source))) return true;
  return source.split("\n").some(isMarkdownLine);
}

export function preparePastedMarkdown(text: string) {
  const source = normalized(text);
  const matter = frontMatter(source);
  if (!matter) return source;

  const gap = matter.rest.length === 0 || matter.rest.startsWith("\n") ? "" : "\n";
  return `\`\`\`yaml\n${matter.yaml}\n\`\`\`${gap}${matter.rest}`;
}

export interface MarkdownClipboard {
  types: readonly string[];
  get(type: string): string;
}

export function markdownPasteText(input: { inCodeBlock: boolean; clipboard: MarkdownClipboard }) {
  const { clipboard } = input;
  if (input.inCodeBlock) return undefined;
  if (clipboard.types.includes("blocknote/html") || clipboard.types.includes("Files")) {
    return undefined;
  }
  if (clipboard.types.includes("text/markdown")) {
    return preparePastedMarkdown(clipboard.get("text/markdown"));
  }
  if (
    clipboard.types.includes("vscode-editor-data") &&
    vscodeClipboardIsMarkdown(clipboard.get("vscode-editor-data"))
  ) {
    return preparePastedMarkdown(clipboard.get("text/plain"));
  }

  const plain = clipboard.get("text/plain");
  if (isMarkdownDocument(plain)) return preparePastedMarkdown(plain);
  return undefined;
}

export function vscodeClipboardIsMarkdown(value: string) {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return false;
    const mode = "mode" in parsed ? parsed.mode : undefined;
    if (typeof mode !== "string") return false;
    const language = mode.toLowerCase();
    return language === "markdown" || language === "mdx";
  } catch {
    return false;
  }
}
