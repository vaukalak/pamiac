import type { BoardDocument, LibraryView } from "@/components/library/board-document";
import { DocumentDiagramSketch } from "@/components/library/document-diagram-sketch";
import { documentPreview } from "@/lib/content";

interface Properties {
  document: BoardDocument;
  layout: LibraryView;
}

export function DocumentCardPreview(props: Properties) {
  const { document, layout } = props;
  if (layout === "list") return null;
  if (document.type === "note") {
    return <p className="doc-preview">{documentPreview(document.type, document.content)}</p>;
  }

  return <DocumentDiagramSketch content={document.content} />;
}
