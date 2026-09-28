import Link from "next/link";
import { DocumentCardMeta } from "@/components/library/document-card-meta";
import type { BoardDocument } from "@/components/library/board-document";
import { documentPreview } from "@/lib/content";

interface Properties {
  document: BoardDocument;
}

export function DocumentCardBody(props: Properties) {
  const { document } = props;

  return (
    <Link className="doc-card-body" href={`/d/${document.id}`}>
      <DocumentCardMeta document={document} />
      <h2>{document.title}</h2>
      <p>{documentPreview(document.type, document.content)}</p>
    </Link>
  );
}
