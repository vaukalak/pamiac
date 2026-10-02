"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useForm } from "react-hook-form";
import { CircuitBoard } from "@/components/home/circuit-board";
import {
  type BoardChange,
  type BoardDocument,
  type LibraryFilter,
  type LibraryView,
} from "@/components/library/board-document";
import { LibraryColumn } from "@/components/library/library-column";
import {
  LibraryLocation,
  readLibraryDrag,
  writeLibraryDrag,
  type LibraryDrag,
} from "@/components/library/library-location";
import type { LibrarySearchValues } from "@/components/library/library-search";
import { LibrarySidebar } from "@/components/library/library-sidebar";
import { LibraryStatus } from "@/components/library/library-status";
import { documentPreview } from "@/lib/content";
import { documentsInFolder, folderStorageKey } from "@/lib/folder-library";
import { libraryItemsQueryKey, libraryItemsQueryOptions } from "@/lib/library-items";
import {
  LIBRARY_FILTER_KEY,
  libraryFilter,
  OPEN_LIBRARY_PENDING,
  openLibraryServerSnapshot,
  openLibrarySnapshot,
  publishOpenLibrary,
  subscribeOpenLibrary,
} from "@/lib/library-memory";
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
import { Page } from "@/ui/Page";

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
  const [drag, setDragState] = useState<LibraryDrag | null>(null);
  const setDrag = useCallback((next: LibraryDrag | null) => {
    writeLibraryDrag(next);
    setDragState(next);
  }, []);
  const [folderId, setFolderId] = useState<string | null>(null);
  const storedLibraryId = useSyncExternalStore(
    subscribeOpenLibrary,
    openLibrarySnapshot,
    openLibraryServerSnapshot,
  );
  const workspaceReady = storedLibraryId !== OPEN_LIBRARY_PENDING;
  const listed = queryClient.getQueryData<NamedWorkspace[]>(workspacesQueryKey) ?? spacesQuery.data;
  const workspaceId = workspaceReady ? openLibraryId(storedLibraryId, listed) : null;
  const query = searchForm.watch("query") ?? "";
  const space = documentsInSpace(workspaceId ?? PERSONAL_SPACE_ID, items, listed);
  const library = documentsInFolder(space, folderId);
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
  const spaceName = spaceTitle(workspaceId ?? PERSONAL_SPACE_ID, listed);

  useEffect(() => {
    const stored = window.localStorage.getItem(VIEW_KEY);
    if (stored === "grid" || stored === "list") setView(stored);
  }, []);

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

  const openFolder = useCallback(
    (next: string | null) => {
      setFolderId(next);
      if (!workspaceId) return;
      const key = folderStorageKey(workspaceId);
      if (next) window.sessionStorage.setItem(key, next);
      else window.sessionStorage.removeItem(key);
    },
    [workspaceId],
  );

  useEffect(() => {
    if (!workspaceId) return;
    const stored = window.sessionStorage.getItem(folderStorageKey(workspaceId));
    setFolderId(stored || null);
  }, [workspaceId]);

  function chooseWorkspace(nextId: string) {
    const stored =
      queryClient.getQueryData<NamedWorkspace[]>(workspacesQueryKey) ?? spacesQuery.data;
    const known = librarySpaces(stored).some((space) => space.id === nextId);
    if (!known) return;
    window.localStorage.setItem(OPEN_LIBRARY_KEY, nextId);
    publishOpenLibrary();
    searchForm.reset({ query: "" });
    const nextFolder = window.sessionStorage.getItem(folderStorageKey(nextId));
    setFolderId(nextFolder || null);
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
    const moving = readLibraryDrag();
    if (!moving || moving.kind !== "document" || moving.id === targetId || !reorder) return;
    const next = [...items];
    const from = next.findIndex((item) => item.id === moving.id);
    const to = next.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    queryClient.setQueryData(libraryItemsQueryKey, next);
    setDrag(null);
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
        email={email}
        filter={filter}
        onFilter={chooseFilter}
        onSelect={chooseWorkspace}
        page="library"
        selectedId={workspaceId ?? ""}
        workspaces={workspaces}
      />
      {workspaceId ? (
        <LibraryLocation
          drag={drag}
          folderId={folderId}
          openFolder={openFolder}
          setDrag={setDrag}
          workspaceId={workspaceId}
        >
          <LibraryColumn
            className="library-main"
            counts={counts}
            dragging={drag?.id ?? null}
            filter={filter}
            form={searchForm}
            libraryCount={library.length}
            onChange={apply}
            onDragStart={(id) => {
              setDrag({ id, kind: "document" });
            }}
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
        </LibraryLocation>
      ) : (
        <Page className="library-main">{null}</Page>
      )}
      {workspaceId ? <LibraryStatus count={space.length} /> : null}
    </div>
  );
}
