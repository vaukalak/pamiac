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
import { WorkspaceCreate } from "@/components/library/workspace-create";
import { WorkspaceMemberAdd } from "@/components/library/workspace-member-add";
import { WorkspaceSelector } from "@/components/library/workspace-selector";
import { WorkspacePaywall } from "@/components/plan/workspace-paywall";
import { libraryItemsQueryKey, libraryItemsQueryOptions } from "@/lib/library-items";
import {
  documentsInSpace,
  librarySpaces,
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
      <div className="workspace-head">
        <div>
          <WorkspaceSelector
            initialWorkspaces={workspaces}
            onSelect={chooseWorkspace}
            selectedId={workspaceId}
          />
          <WorkspaceCreate onCreated={chooseWorkspace} />
          <WorkspaceMemberAdd key={workspaceId} workspaceId={workspaceId} />
          <h1>Library</h1>
          <p className="lede">Notes and diagrams.</p>
        </div>
        <LibraryCreate />
      </div>
      <WorkspacePaywall workspaceId={workspaceId} />
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
