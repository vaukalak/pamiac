import type { BoardDocument } from "@/components/library/board-document";
import { DocumentCardFoot } from "@/components/library/document-card-foot";
import { DocumentCardPreview } from "@/components/library/document-card-preview";

interface Properties {
  document: BoardDocument;
}

export function DocumentCardMeta(props: Properties) {
  const { document } = props;
  const typeLabel = document.type === "note" ? "NOTE" : "DIAGRAM";

  return (
    <>
      <span className="doc-type">{typeLabel}</span>
      <h2>{document.title}</h2>
      <DocumentCardPreview document={document} />
      <DocumentCardFoot document={document} />
    </>
  );
}
