import type { BoardDocument, LibraryView } from "@/components/library/board-document";
import { DocumentCardFoot } from "@/components/library/document-card-foot";
import { DocumentCardPreview } from "@/components/library/document-card-preview";
import { DocumentTypeIcon } from "@/components/library/document-type-icon";

interface Properties {
  document: BoardDocument;
  layout: LibraryView;
}

export function DocumentCardMeta(props: Properties) {
  const { document, layout } = props;

  return (
    <>
      <div className="doc-card-title">
        <DocumentTypeIcon type={document.type} />
        <h2>{document.title}</h2>
      </div>
      <DocumentCardPreview document={document} layout={layout} />
      <DocumentCardFoot document={document} />
    </>
  );
}
