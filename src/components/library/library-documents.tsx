"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  BoardChange,
  BoardDocument,
  LibraryFilter,
  LibraryView,
} from "@/components/library/board-document";
import { DocumentCard } from "@/components/library/document-card";
import { FolderCard } from "@/components/library/folder-card";
import { LibraryEmpty } from "@/components/library/library-empty";
import { useLibraryLocation } from "@/components/library/library-location";
import { childFolders } from "@/lib/folder-library";
import { libraryFoldersQueryOptions } from "@/lib/library-folders";
import { Alert } from "@/ui/Alert";

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
  const { folderId, workspaceId } = useLibraryLocation();
  const foldersQuery = useQuery(libraryFoldersQueryOptions());
  const folders =
    filter === "all" ? childFolders(foldersQuery.data ?? [], workspaceId, folderId) : [];
  const waiting = filter === "all" && foldersQuery.isPending;
  const message = foldersQuery.error instanceof Error ? foldersQuery.error.message : "";

  if (!waiting && visible.length === 0 && folders.length === 0) {
    return <LibraryEmpty filter={filter} />;
  }

  return (
    <div className={layout === "grid" ? "doc-grid" : "doc-list"}>
      {message ? <Alert>{message}</Alert> : null}
      {folders.map((folder) => (
        <FolderCard
          folder={folder}
          folders={foldersQuery.data ?? []}
          key={folder.id}
          layout={layout}
        />
      ))}
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
