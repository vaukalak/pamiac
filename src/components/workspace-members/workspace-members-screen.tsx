"use client";

import { LibraryShell } from "@/components/library/library-shell";
import { WorkspaceMembersBody } from "@/components/workspace-members/workspace-members-body";
import type { NamedWorkspace } from "@/lib/library-spaces";

interface Properties {
  email: string;
  workspaces: NamedWorkspace[];
}

export function WorkspaceMembersScreen(props: Properties) {
  const { email, workspaces } = props;

  return (
    <LibraryShell email={email} page="members" workspaces={workspaces}>
      <WorkspaceMembersBody email={email} />
    </LibraryShell>
  );
}
