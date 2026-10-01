"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileMenu } from "@/components/header/profile-menu";
import { CircuitBoard } from "@/components/home/circuit-board";
import type { LibraryFilter } from "@/components/library/board-document";
import { LibrarySidebar } from "@/components/library/library-sidebar";
import { TokenMain } from "@/components/tokens/token-main";
import { LIBRARY_FILTER_KEY, OPEN_LIBRARY_KEY } from "@/lib/library-memory";
import {
  librarySpaces,
  openLibraryId,
  openWorkspaceName,
  PERSONAL_SPACE_ID,
  type NamedWorkspace,
} from "@/lib/library-spaces";
import { workspacesQueryKey, workspacesQueryOptions } from "@/lib/library-workspaces";

interface Properties {
  email: string;
  workspaces: NamedWorkspace[];
}

function spaceTitle(workspaceId: string, workspaces: readonly NamedWorkspace[] | undefined) {
  if (workspaceId === PERSONAL_SPACE_ID) return "Personal";
  return openWorkspaceName(workspaceId, workspaces) || "Workspace";
}

export function TokenShell(props: Properties) {
  const { email, workspaces } = props;
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
    setWorkspaceId(nextId);
  }

  function chooseFilter(next: LibraryFilter) {
    window.localStorage.setItem(LIBRARY_FILTER_KEY, next);
    router.push("/workspace");
  }

  return (
    <div className="library-shell">
      <CircuitBoard />
      <LibrarySidebar
        filter="all"
        onFilter={chooseFilter}
        onSelect={chooseWorkspace}
        page="connections"
        selectedId={workspaceId}
        workspaces={workspaces}
      />
      <ProfileMenu email={email} />
      <TokenMain spaceName={spaceTitle(workspaceId, spacesQuery.data)} />
    </div>
  );
}
