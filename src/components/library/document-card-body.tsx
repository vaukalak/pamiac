import Link from "next/link";
import type { BoardDocument } from "@/components/library/board-document";
import { DocumentCardMeta } from "@/components/library/document-card-meta";

interface Properties {
  document: BoardDocument;
}

export function DocumentCardBody(props: Properties) {
  const { document } = props;

  return (
    <Link className="doc-card-body" href={`/d/${document.id}`}>
      <DocumentCardMeta document={document} />
    </Link>
  );
}
