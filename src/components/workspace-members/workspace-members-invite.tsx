"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLibraryShell } from "@/components/library/library-shell";
import { WorkspaceMemberAdd } from "@/components/library/workspace-member-add";
import { WorkspaceMembersInviteDialog } from "@/components/workspace-members/workspace-members-invite-dialog";
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

  function close() {
    setOpen(false);
  }

  if (!managing) return null;

  return (
    <>
      <Button className="library-lime" onClick={() => setOpen(true)} type="button">
        Invite member
      </Button>
      {open ? (
        <WorkspaceMembersInviteDialog onClose={close}>
          <WorkspaceMemberAdd workspaceId={shell.workspaceId} />
        </WorkspaceMembersInviteDialog>
      ) : null}
    </>
  );
}
