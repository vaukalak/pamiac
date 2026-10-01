"use client";

import { useQuery } from "@tanstack/react-query";
import { useLibraryShell } from "@/components/library/library-shell";
import { librarySpaceTitle } from "@/lib/library-spaces";
import { workspacesQueryOptions } from "@/lib/library-workspaces";
import { PageTitle } from "@/ui/PageTitle";

export function WorkspaceMembersHeading() {
  const shell = useLibraryShell();
  const spaces = useQuery({
    ...workspacesQueryOptions(),
    initialData: shell.workspaces,
  });
  const name = librarySpaceTitle(shell.workspaceId, spaces.data);

  return (
    <div className="library-heading-copy">
      <p className="library-crumb">{name} / Members</p>
      <PageTitle subtitle="Manage who has access to this workspace." title="Members" />
    </div>
  );
}
