"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { ProfileMenu } from "@/components/header/profile-menu";
import { CircuitBoard } from "@/components/home/circuit-board";
import {
  type BoardChange,
  type BoardDocument,
  type LibraryFilter,
  type LibraryView,
} from "@/components/library/board-document";
import { LibraryColumn } from "@/components/library/library-column";
import type { LibrarySearchValues } from "@/components/library/library-search";
import { LibrarySidebar } from "@/components/library/library-sidebar";
import { LibraryStatus } from "@/components/library/library-status";
import { documentPreview } from "@/lib/content";
import { libraryItemsQueryKey, libraryItemsQueryOptions } from "@/lib/library-items";
import { LIBRARY_FILTER_KEY, libraryFilter } from "@/lib/library-memory";
import { libraryQueryMatches, libraryTypeCounts } from "@/lib/library-query";
import {
  documentsInSpace,
  librarySpaces,
  openLibraryId,
  openWorkspaceName,
  PERSONAL_SPACE_ID,
  type NamedWorkspace,
} from "@/lib/library-spaces";
import { workspacesQueryKey, workspacesQueryOptions } from "@/lib/library-workspaces";

export type { BoardDocument };

interface Properties {
  documents: BoardDocument[];
  email: string;
  workspaces: NamedWorkspace[];
}

const VIEW_KEY = "pamiac-library-view";
const OPEN_LIBRARY_KEY = "pamiac-open-library";

function spaceTitle(workspaceId: string, workspaces: readonly NamedWorkspace[] | undefined) {
  if (workspaceId === PERSONAL_SPACE_ID) return "Personal";
  return openWorkspaceName(workspaceId, workspaces) || "Workspace";
}

export function DocumentBoard(props: Properties) {
  const { documents, email, workspaces } = props;
  const queryClient = useQueryClient();
  const itemsQuery = useQuery({
    ...libraryItemsQueryOptions(),
    initialData: documents,
  });
  const spacesQuery = useQuery({
    ...workspacesQueryOptions(),
    initialData: workspaces,
  });
  const searchForm = useForm<LibrarySearchValues>({
    defaultValues: { query: "" },
  });
  const items = itemsQuery.data;
  const [filter, setFilter] = useState<LibraryFilter>("all");
  const [view, setView] = useState<LibraryView>("grid");
  const [dragging, setDragging] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState(PERSONAL_SPACE_ID);
  const query = searchForm.watch("query") ?? "";
  const library = documentsInSpace(workspaceId, items, spacesQuery.data);
  const counts = libraryTypeCounts(library);
  const visible = useMemo(
    () =>
      library.filter(
        (item) =>
          (filter === "all" || item.type === filter) &&
          libraryQueryMatches(item.title, documentPreview(item.type, item.content), query),
      ),
    [library, filter, query],
  );
  const reorder =
    view === "grid" && filter === "all" && workspaceId === PERSONAL_SPACE_ID && query.trim() === "";
  const spaceName = spaceTitle(workspaceId, spacesQuery.data);

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

  useEffect(() => {
    setFilter(libraryFilter(window.localStorage.getItem(LIBRARY_FILTER_KEY)));
  }, []);

  function chooseFilter(next: LibraryFilter) {
    setFilter(next);
    window.localStorage.setItem(LIBRARY_FILTER_KEY, next);
  }

  function chooseWorkspace(nextId: string) {
    const stored =
      queryClient.getQueryData<NamedWorkspace[]>(workspacesQueryKey) ?? spacesQuery.data;
    const known = librarySpaces(stored).some((space) => space.id === nextId);
    if (!known) return;
    window.localStorage.setItem(OPEN_LIBRARY_KEY, nextId);
    setWorkspaceId(nextId);
    searchForm.reset({ query: "" });
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
    <div className="library-shell">
      <CircuitBoard />
      <LibrarySidebar
        filter={filter}
        onFilter={chooseFilter}
        onSelect={chooseWorkspace}
        page="library"
        selectedId={workspaceId}
        workspaces={workspaces}
      />
      <ProfileMenu email={email} />
      <LibraryColumn
        className="library-main"
        counts={counts}
        dragging={dragging}
        filter={filter}
        form={searchForm}
        libraryCount={library.length}
        onChange={apply}
        onDragStart={setDragging}
        onDrop={(id) => {
          void dropOn(id);
        }}
        onFilter={chooseFilter}
        onView={chooseView}
        reorder={reorder}
        spaceName={spaceName}
        view={view}
        visible={visible}
        workspaceId={workspaceId}
      />
      <LibraryStatus count={library.length} />
    </div>
  );
}
