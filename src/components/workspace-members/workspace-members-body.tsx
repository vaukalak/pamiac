"use client";

import { useLibraryShell } from "@/components/library/library-shell";
import { WorkspaceMembersList } from "@/components/workspace-members/workspace-members-list";
import { WorkspaceMembersPersonal } from "@/components/workspace-members/workspace-members-personal";
import { WorkspaceMembersInvite } from "@/components/workspace-members/workspace-members-invite";
import { PERSONAL_SPACE_ID } from "@/lib/library-spaces";

interface Properties {
  email: string;
}

export function WorkspaceMembersBody(props: Properties) {
  const { email } = props;
  const shell = useLibraryShell();
  const personal = shell.workspaceId === PERSONAL_SPACE_ID;

  return (
    <>
      <WorkspaceMembersInvite />
      {personal ? <WorkspaceMembersPersonal /> : <WorkspaceMembersList email={email} />}
    </>
  );
}
