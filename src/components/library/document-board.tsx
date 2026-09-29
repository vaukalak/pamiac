"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  type BoardChange,
  type BoardDocument,
  type LibraryFilter,
  type LibraryView,
} from "@/components/library/board-document";
import { LibraryDocuments } from "@/components/library/library-documents";
import { LibraryHeader } from "@/components/library/library-header";
import { LibraryManage } from "@/components/library/library-manage";
import { LibraryTools } from "@/components/library/library-tools";
import { libraryItemsQueryKey, libraryItemsQueryOptions } from "@/lib/library-items";
import {
  documentsInSpace,
  librarySpaces,
  managesWorkspace,
  openLibraryId,
  PERSONAL_SPACE_ID,
  type NamedWorkspace,
} from "@/lib/library-spaces";
import { workspacesQueryKey, workspacesQueryOptions } from "@/lib/library-workspaces";

export type { BoardDocument };

interface Properties {
  documents: BoardDocument[];
  workspaces: NamedWorkspace[];
}

const VIEW_KEY = "pamiac-library-view";
const OPEN_LIBRARY_KEY = "pamiac-open-library";

export function DocumentBoard(props: Properties) {
  const { documents, workspaces } = props;
  const queryClient = useQueryClient();
  const itemsQuery = useQuery({
    ...libraryItemsQueryOptions(),
    initialData: documents,
  });
  const spacesQuery = useQuery({
    ...workspacesQueryOptions(),
    initialData: workspaces,
  });
  const items = itemsQuery.data;
  const [filter, setFilter] = useState<LibraryFilter>("all");
  const [view, setView] = useState<LibraryView>("grid");
  const [dragging, setDragging] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState(PERSONAL_SPACE_ID);
  const library = documentsInSpace(workspaceId, items, spacesQuery.data);
  const managing = managesWorkspace(workspaceId, spacesQuery.data);
  const visible = useMemo(
    () => library.filter((item) => filter === "all" || item.type === filter),
    [library, filter],
  );
  const reorder = view === "grid" && filter === "all" && workspaceId === PERSONAL_SPACE_ID;

  useEffect(() => {
    const stored = window.localStorage.getItem(VIEW_KEY);
    if (stored === "grid" || stored === "list") setView(stored);
  }, []);

  useEffect(() => {
    const next = openLibraryId(window.localStorage.getItem(OPEN_LIBRARY_KEY), spacesQuery.data);
    setWorkspaceId(next);
  }, [spacesQuery.data]);

  function chooseView(next: LibraryView) {
    setView(next);
    window.localStorage.setItem(VIEW_KEY, next);
  }

  function chooseWorkspace(nextId: string) {
    const stored =
      queryClient.getQueryData<NamedWorkspace[]>(workspacesQueryKey) ?? spacesQuery.data;
    const known = librarySpaces(stored).some((space) => space.id === nextId);
    if (!known) return;
    window.localStorage.setItem(OPEN_LIBRARY_KEY, nextId);
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
          workspaceId: change.workspaceId,
        };
      });
    });
  }

  async function dropOn(targetId: string) {
    if (!dragging || dragging === targetId || !reorder) return;
    const next = [...items];
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
      <LibraryHeader onSelect={chooseWorkspace} selectedId={workspaceId} workspaces={workspaces} />
      <LibraryManage managing={managing} onCreated={chooseWorkspace} workspaceId={workspaceId} />
      <LibraryTools filter={filter} onFilter={setFilter} onView={chooseView} view={view} />
      <LibraryDocuments
        dragging={dragging}
        filter={filter}
        layout={view}
        onChange={apply}
        onDragStart={setDragging}
        onDrop={(id) => void dropOn(id)}
        reorder={reorder}
        visible={visible}
      />
      {reorder && library.length > 1 ? (
        <p className="hint">Drag cards to reorder the library.</p>
      ) : null}
    </div>
  );
}
