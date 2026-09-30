import type { BoardDocument } from "@/components/library/board-document";
import { DocumentDiagramSketch } from "@/components/library/document-diagram-sketch";
import { documentPreview } from "@/lib/content";

interface Properties {
  document: BoardDocument;
}

export function DocumentCardPreview(props: Properties) {
  const { document } = props;
  if (document.type === "note") return <p>{documentPreview(document.type, document.content)}</p>;

  return <DocumentDiagramSketch content={document.content} />;
}
