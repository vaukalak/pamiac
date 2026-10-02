"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState, type DragEvent } from "react";
import type { BoardDocument, LibraryView } from "@/components/library/board-document";
import { FolderCardBody } from "@/components/library/folder-card-body";
import { readLibraryDrag, useLibraryLocation } from "@/components/library/library-location";
import { folderMovesIntoItself, type FolderRecord } from "@/lib/folder-library";
import { libraryFoldersQueryKey } from "@/lib/library-folders";
import { libraryItemsQueryKey } from "@/lib/library-items";
import { Alert } from "@/ui/Alert";

interface Properties {
  folder: FolderRecord;
  folders: readonly FolderRecord[];
  layout: LibraryView;
}

async function moveIntoFolder(kind: "document" | "folder", id: string, targetId: string) {
  const response = await fetch("/api/folders/move", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      kind === "document"
        ? { kind, documentId: id, folderId: targetId }
        : { kind, folderId: id, parentId: targetId },
    ),
  }).catch(() => null);
  if (!response) throw new Error("Could not move that into the folder");
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  if (!response.ok) throw new Error(body?.error ?? "Could not move that into the folder");
}

export function FolderCard(props: Properties) {
  const { folder, folders, layout } = props;
  const { drag, openFolder, setDrag } = useLibraryLocation();
  const queryClient = useQueryClient();
  const [over, setOver] = useState(false);
  const moved = useRef(false);
  const mutation = useMutation({
    mutationFn: async (item: { id: string; kind: "document" | "folder" }) => {
      if (item.kind === "folder" && folderMovesIntoItself(folders, item.id, folder.id)) {
        throw new Error("A folder cannot move into itself");
      }
      await moveIntoFolder(item.kind, item.id, folder.id);
      return item;
    },
    onSuccess: async (item) => {
      if (item.kind === "document") {
        queryClient.setQueryData<BoardDocument[]>(libraryItemsQueryKey, (current) =>
          current?.map((document) =>
            document.id === item.id ? { ...document, folderId: folder.id } : document,
          ),
        );
      }
      await queryClient.invalidateQueries({ queryKey: libraryFoldersQueryKey });
      await queryClient.invalidateQueries({ queryKey: libraryItemsQueryKey });
      setDrag(null);
    },
  });
  const message = mutation.error instanceof Error ? mutation.error.message : "";
  const className = [
    "doc-card",
    layout,
    "folder-card",
    drag?.id === folder.id ? "dragging" : "",
    over ? "is-drop" : "",
  ]
    .filter(Boolean)
    .join(" ");

  function acceptsLibraryDrag(event: DragEvent<HTMLElement>) {
    return ![...event.dataTransfer.types].includes("Files");
  }

  function onDrop(event: DragEvent<HTMLElement>) {
    const moving = readLibraryDrag();
    if (!acceptsLibraryDrag(event) || !moving || moving.id === folder.id) return;
    event.preventDefault();
    event.stopPropagation();
    setOver(false);
    mutation.mutate(moving);
  }

  return (
    <article
      className={className}
      draggable
      onDragEnd={() => {
        window.setTimeout(() => {
          setDrag(null);
        }, 0);
      }}
      onDragLeave={() => {
        setOver(false);
      }}
      onDragOver={(event) => {
        const moving = readLibraryDrag();
        if (!acceptsLibraryDrag(event) || !moving || moving.id === folder.id) return;
        event.preventDefault();
        setOver(true);
      }}
      onDragStart={(event) => {
        moved.current = true;
        event.dataTransfer.setData("text/plain", folder.id);
        event.dataTransfer.effectAllowed = "move";
        setDrag({ id: folder.id, kind: "folder" });
      }}
      onDrop={onDrop}
    >
      <FolderCardBody
        layout={layout}
        name={folder.name}
        onOpen={() => {
          if (moved.current) {
            moved.current = false;
            return;
          }
          openFolder(folder.id);
        }}
      />
      {message ? <Alert>{message}</Alert> : null}
    </article>
  );
}
