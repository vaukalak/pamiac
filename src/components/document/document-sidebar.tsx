"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { LibraryFilter } from "@/components/library/board-document";
import { LibrarySidebar } from "@/components/library/library-sidebar";
import { LIBRARY_FILTER_KEY, LIBRARY_PANEL_KEY, OPEN_LIBRARY_KEY } from "@/lib/library-memory";
import {
  librarySpaces,
  managesWorkspace,
  openLibraryId,
  type NamedWorkspace,
} from "@/lib/library-spaces";
import { workspacesQueryKey, workspacesQueryOptions } from "@/lib/library-workspaces";

interface Properties {
  documentType: "note" | "diagram";
  workspaceId: string | null;
  workspaces: NamedWorkspace[];
}

export function DocumentSidebar(props: Properties) {
  const { documentType, workspaceId, workspaces } = props;
  const router = useRouter();
  const queryClient = useQueryClient();
  const spacesQuery = useQuery({
    ...workspacesQueryOptions(),
    initialData: workspaces,
  });
  const selectedId = openLibraryId(workspaceId, spacesQuery.data);
  const managing = managesWorkspace(selectedId, spacesQuery.data);

  function openLibrary(nextId: string) {
    const stored =
      queryClient.getQueryData<NamedWorkspace[]>(workspacesQueryKey) ?? spacesQuery.data;
    const known = librarySpaces(stored).some((space) => space.id === nextId);
    if (!known) return;
    window.localStorage.setItem(OPEN_LIBRARY_KEY, nextId);
    router.push("/workspace");
  }

  function chooseFilter(next: LibraryFilter) {
    window.localStorage.setItem(LIBRARY_FILTER_KEY, next);
    window.localStorage.setItem(LIBRARY_PANEL_KEY, "dashboard");
    router.push("/workspace");
  }

  function openManage() {
    window.localStorage.setItem(OPEN_LIBRARY_KEY, selectedId);
    window.localStorage.setItem(LIBRARY_PANEL_KEY, "manage");
    router.push("/workspace");
  }

  return (
    <LibrarySidebar
      filter={documentType}
      managing={managing}
      onFilter={chooseFilter}
      onManage={openManage}
      onSelect={openLibrary}
      selectedId={selectedId}
      workspaces={workspaces}
    />
  );
}
