"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLibraryShell } from "@/components/library/library-shell";
import { WorkspaceMemberAdd } from "@/components/library/workspace-member-add";
import { WorkspaceMembersHeading } from "@/components/workspace-members/workspace-members-heading";
import { managesWorkspace, PERSONAL_SPACE_ID } from "@/lib/library-spaces";
import { workspacesQueryOptions } from "@/lib/library-workspaces";
import { Button } from "@/ui/Button";

export function WorkspaceMembersInvite() {
  const shell = useLibraryShell();
  const spaces = useQuery({
    ...workspacesQueryOptions(),
    initialData: shell.workspaces,
  });
  const [open, setOpen] = useState(false);
  const named = shell.workspaceId !== PERSONAL_SPACE_ID;
  const managing = named && managesWorkspace(shell.workspaceId, spaces.data ?? []);

  return (
    <>
      <div className="library-heading">
        <WorkspaceMembersHeading />
        {managing ? (
          <Button
            className="library-lime"
            onClick={() => setOpen((current) => !current)}
            type="button"
          >
            Invite member
          </Button>
        ) : null}
      </div>
      {managing && open ? (
        <div className="workspace-invite-form">
          <WorkspaceMemberAdd key={shell.workspaceId} workspaceId={shell.workspaceId} />
        </div>
      ) : null}
    </>
  );
}
