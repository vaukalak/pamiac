"use client";

import { useLibraryShell } from "@/components/library/library-shell";
import { WorkspaceMembersHeading } from "@/components/workspace-members/workspace-members-heading";
import { WorkspaceMembersInvite } from "@/components/workspace-members/workspace-members-invite";
import { WorkspaceMembersList } from "@/components/workspace-members/workspace-members-list";
import { WorkspaceMembersPersonal } from "@/components/workspace-members/workspace-members-personal";
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
      <div className="library-heading">
        <WorkspaceMembersHeading />
        <WorkspaceMembersInvite />
      </div>
      {personal ? <WorkspaceMembersPersonal /> : <WorkspaceMembersList email={email} />}
    </>
  );
}
