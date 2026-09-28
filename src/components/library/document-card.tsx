import type { BoardChange, BoardDocument, LibraryView } from "@/components/library/board-document";
import { DocumentCardBody } from "@/components/library/document-card-body";
import { DocumentMenu } from "@/components/library/document-menu";

interface Properties {
  document: BoardDocument;
  dragging: boolean;
  layout: LibraryView;
  reorder: boolean;
  onChange: (change: BoardChange) => void;
  onDragStart: (id: string) => void;
  onDrop: (id: string) => void;
}

export function DocumentCard(props: Properties) {
  const { document, dragging, layout, reorder, onChange, onDragStart, onDrop } = props;

  return (
    <article
      className={`doc-card ${layout}${dragging ? " dragging" : ""}`}
      draggable={reorder}
      onDragOver={(event) => {
        if (reorder) event.preventDefault();
      }}
      onDragStart={(event) => {
        if ((event.target as HTMLElement).closest(".doc-menu")) {
          event.preventDefault();
          return;
        }
        onDragStart(document.id);
      }}
      onDrop={(event) => {
        if (!reorder) return;
        event.preventDefault();
        onDrop(document.id);
      }}
    >
      <DocumentCardBody document={document} />
      <DocumentMenu document={document} onChange={onChange} />
    </article>
  );
}
