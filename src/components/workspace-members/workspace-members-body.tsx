"use client";

import { useLibraryShell } from "@/components/library/library-shell";
import { WorkspaceMembersList } from "@/components/workspace-members/workspace-members-list";
import { WorkspaceMembersPersonal } from "@/components/workspace-members/workspace-members-personal";
import { WorkspaceMembersTop } from "@/components/workspace-members/workspace-members-top";
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
      <WorkspaceMembersTop />
      {personal ? <WorkspaceMembersPersonal /> : <WorkspaceMembersList email={email} />}
    </>
  );
}
