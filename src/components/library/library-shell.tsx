"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CircuitBoard } from "@/components/home/circuit-board";
import type { LibraryFilter } from "@/components/library/board-document";
import { LibrarySidebar, type LibraryPage } from "@/components/library/library-sidebar";
import {
  librarySpaces,
  openLibraryId,
  PERSONAL_SPACE_ID,
  type NamedWorkspace,
} from "@/lib/library-spaces";
import { workspacesQueryKey, workspacesQueryOptions } from "@/lib/library-workspaces";
import { Page } from "@/ui/Page";

const OPEN_LIBRARY_KEY = "pamiac-open-library";

interface ShellValue {
  workspaceId: string;
  workspaces: NamedWorkspace[];
}

const LibraryShellContext = createContext<ShellValue>({
  workspaceId: PERSONAL_SPACE_ID,
  workspaces: [],
});

export function useLibraryShell() {
  return useContext(LibraryShellContext);
}

interface Properties {
  children: ReactNode;
  email: string;
  page: Exclude<LibraryPage, "library">;
  workspaces: NamedWorkspace[];
}

export function LibraryShell(props: Properties) {
  const { children, email, page, workspaces } = props;
  const router = useRouter();
  const queryClient = useQueryClient();
  const spacesQuery = useQuery({
    ...workspacesQueryOptions(),
    initialData: workspaces,
  });
  const [workspaceId, setWorkspaceId] = useState(PERSONAL_SPACE_ID);

  useEffect(() => {
    const next = openLibraryId(window.localStorage.getItem(OPEN_LIBRARY_KEY), spacesQuery.data);
    setWorkspaceId(next);
  }, [spacesQuery.data]);

  function chooseWorkspace(nextId: string) {
    const stored =
      queryClient.getQueryData<NamedWorkspace[]>(workspacesQueryKey) ?? spacesQuery.data;
    const known = librarySpaces(stored).some((space) => space.id === nextId);
    if (!known) return;
    window.localStorage.setItem(OPEN_LIBRARY_KEY, nextId);
    router.push("/workspace");
  }

  function onFilter(_next: LibraryFilter) {}

  return (
    <div className="library-shell">
      <CircuitBoard />
      <LibrarySidebar
        email={email}
        filter="all"
        onFilter={onFilter}
        onSelect={chooseWorkspace}
        page={page}
        selectedId={workspaceId}
        workspaces={workspaces}
      />
      <LibraryShellContext.Provider value={{ workspaceId, workspaces }}>
        <Page className="library-main">{children}</Page>
      </LibraryShellContext.Provider>
    </div>
  );
}
