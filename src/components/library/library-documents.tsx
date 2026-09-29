"use client";

import type {
  BoardChange,
  BoardDocument,
  LibraryFilter,
  LibraryView,
} from "@/components/library/board-document";
import { DocumentCard } from "@/components/library/document-card";
import { LibraryEmpty } from "@/components/library/library-empty";

interface Properties {
  dragging: string | null;
  filter: LibraryFilter;
  layout: LibraryView;
  onChange: (change: BoardChange) => void;
  onDragStart: (id: string) => void;
  onDrop: (id: string) => void;
  reorder: boolean;
  visible: BoardDocument[];
}

export function LibraryDocuments(props: Properties) {
  const { dragging, filter, layout, onChange, onDragStart, onDrop, reorder, visible } = props;

  if (visible.length === 0) return <LibraryEmpty filter={filter} />;

  return (
    <div className={layout === "grid" ? "doc-grid" : "doc-list"}>
      {visible.map((document) => (
        <DocumentCard
          document={document}
          dragging={dragging === document.id}
          key={document.id}
          layout={layout}
          onChange={onChange}
          onDragStart={onDragStart}
          onDrop={onDrop}
          reorder={reorder}
        />
      ))}
    </div>
  );
}
