"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  type BoardChange,
  type BoardDocument,
  type LibraryFilter,
  type LibraryView,
} from "@/components/library/board-document";
import { DocumentCard } from "@/components/library/document-card";
import { LibraryCreate } from "@/components/library/library-create";
import { LibraryEmpty } from "@/components/library/library-empty";
import { LibraryFilters } from "@/components/library/library-filters";
import { ViewToggle } from "@/components/library/view-toggle";
import { WorkspaceSelector } from "@/components/library/workspace-selector";
import { libraryItemsQueryKey, libraryItemsQueryOptions } from "@/lib/library-items";
import { documentsInSpace, librarySpaces, PERSONAL_SPACE_ID } from "@/lib/library-spaces";

export type { BoardDocument };

interface Properties {
  documents: BoardDocument[];
}

const VIEW_KEY = "pamiac-library-view";

export function DocumentBoard(props: Properties) {
  const { documents } = props;
  const queryClient = useQueryClient();
  const itemsQuery = useQuery({
    ...libraryItemsQueryOptions(),
    initialData: documents,
  });
  const items = itemsQuery.data;
  const [filter, setFilter] = useState<LibraryFilter>("all");
  const [view, setView] = useState<LibraryView>("grid");
  const [dragging, setDragging] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState(PERSONAL_SPACE_ID);
  const library = documentsInSpace(workspaceId, items);
  const visible = useMemo(
    () => library.filter((item) => filter === "all" || item.type === filter),
    [library, filter],
  );
  const reorder = view === "grid" && filter === "all";

  useEffect(() => {
    const stored = window.localStorage.getItem(VIEW_KEY);
    if (stored === "grid" || stored === "list") setView(stored);
  }, []);

  function chooseView(next: LibraryView) {
    setView(next);
    window.localStorage.setItem(VIEW_KEY, next);
  }

  function chooseWorkspace(nextId: string) {
    const known = librarySpaces().some((space) => space.id === nextId);
    if (!known) return;
    setWorkspaceId(nextId);
  }

  function apply(change: BoardChange) {
    queryClient.setQueryData<BoardDocument[]>(libraryItemsQueryKey, (current) => {
      const list = current ?? documents;
      if (change.kind === "delete") return list.filter((item) => item.id !== change.id);
      return list.map((item) => {
        if (item.id !== change.id) return item;
        if (change.kind === "rename") return { ...item, title: change.title };
        return {
          ...item,
          visibility: change.visibility,
          emails: change.emails,
          hasPassword: change.hasPassword,
        };
      });
    });
  }

  async function dropOn(targetId: string) {
    if (!dragging || dragging === targetId || !reorder) return;
    const next = [...library];
    const from = next.findIndex((item) => item.id === dragging);
    const to = next.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    queryClient.setQueryData(libraryItemsQueryKey, next);
    setDragging(null);
    await fetch("/api/documents", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: next.map((item) => item.id) }),
    });
  }

  return (
    <div>
      <div className="workspace-head">
        <div>
          <WorkspaceSelector onSelect={chooseWorkspace} selectedId={workspaceId} />
          <h1>Library</h1>
          <p className="lede">Notes and diagrams.</p>
        </div>
        <LibraryCreate />
      </div>
      <div className="library-tools">
        <LibraryFilters filter={filter} onChange={setFilter} />
        <ViewToggle onChange={chooseView} view={view} />
      </div>
      {visible.length === 0 ? (
        <LibraryEmpty filter={filter} />
      ) : (
        <div className={view === "grid" ? "doc-grid" : "doc-list"}>
          {visible.map((document) => (
            <DocumentCard
              document={document}
              dragging={dragging === document.id}
              key={document.id}
              layout={view}
              onChange={apply}
              onDragStart={setDragging}
              onDrop={(id) => void dropOn(id)}
              reorder={reorder}
            />
          ))}
        </div>
      )}
      {reorder && library.length > 1 ? (
        <p className="hint">Drag cards to reorder the library.</p>
      ) : null}
    </div>
  );
}
