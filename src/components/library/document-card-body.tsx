import Link from "next/link";
import type { BoardDocument, LibraryView } from "@/components/library/board-document";
import { DocumentCardMeta } from "@/components/library/document-card-meta";

interface Properties {
  document: BoardDocument;
  layout: LibraryView;
}

export function DocumentCardBody(props: Properties) {
  const { document, layout } = props;

  return (
    <Link className="doc-card-body" href={`/d/${document.id}`}>
      <DocumentCardMeta document={document} layout={layout} />
    </Link>
  );
}
