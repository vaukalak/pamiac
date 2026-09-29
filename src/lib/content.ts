import { readableBlockMarkdown } from "@/lib/block-link";
import { diagramToText, emptyDiagram, parseDiagram, type DiagramContent } from "@/lib/diagram";
import { excerpt } from "@/lib/embeddings";

export type DocumentType = "note" | "diagram";

export function defaultTitle(type: DocumentType) {
  return type === "note" ? "Untitled note" : "Untitled diagram";
}

export function readDiagram(content: string): DiagramContent {
  if (!content.trim()) return emptyDiagram();
  try {
    return parseDiagram(JSON.parse(content));
  } catch {
    return emptyDiagram();
  }
}

export function documentText(type: DocumentType, title: string, content: string) {
  if (type === "note") return `${title}\n\n${readableBlockMarkdown(content)}`;
  return `${title}\n\n${diagramToText(readDiagram(content))}`;
}

export function documentPreview(type: DocumentType, content: string) {
  if (type === "note") return excerpt(readableBlockMarkdown(content), 140) || "Empty note";
  const diagram = readDiagram(content);
  if (!diagram.nodes.length) return "Empty diagram";
  return diagram.nodes
    .slice(0, 6)
    .map((node) => node.name)
    .join(" · ");
}

export function serializeContent(type: DocumentType, content: unknown, previous?: string) {
  if (type === "note") {
    if (typeof content !== "string") throw new Error("Note content must be markdown text");
    return content;
  }
  const parsed = typeof content === "string" ? JSON.parse(content) : content;
  const prior = previous ? readDiagram(previous) : undefined;
  return JSON.stringify(parseDiagram(parsed, prior));
}
