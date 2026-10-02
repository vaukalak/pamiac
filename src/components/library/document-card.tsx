import type { BoardChange, BoardDocument, LibraryView } from "@/components/library/board-document";
import { DocumentCardBody } from "@/components/library/document-card-body";
import { DocumentMenu } from "@/components/library/document-menu";
import { useLibraryLocation } from "@/components/library/library-location";

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
  const { setDrag } = useLibraryLocation();

  return (
    <article
      className={`doc-card ${layout}${dragging ? " dragging" : ""}`}
      draggable
      onDragOver={(event) => {
        if (reorder) event.preventDefault();
      }}
      onDragStart={(event) => {
        if ((event.target as HTMLElement).closest(".doc-menu")) {
          event.preventDefault();
          return;
        }
        event.dataTransfer.setData("text/plain", document.id);
        event.dataTransfer.effectAllowed = "move";
        onDragStart(document.id);
      }}
      onDragEnd={() => {
        window.setTimeout(() => {
          setDrag(null);
        }, 0);
      }}
      onDrop={(event) => {
        if (!reorder) return;
        event.preventDefault();
        onDrop(document.id);
      }}
    >
      <DocumentCardBody document={document} layout={layout} />
      <DocumentMenu document={document} onChange={onChange} />
    </article>
  );
}
