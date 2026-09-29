"use client";

import { WorkspaceCreate } from "@/components/library/workspace-create";
import { WorkspaceDelete } from "@/components/library/workspace-delete";
import { WorkspaceLeave } from "@/components/library/workspace-leave";
import { WorkspaceMemberAdd } from "@/components/library/workspace-member-add";

interface Properties {
  managing: boolean;
  onCreated: (workspaceId: string) => void;
  workspaceId: string;
}

export function LibraryManage(props: Properties) {
  const { managing, onCreated, workspaceId } = props;

  return (
    <details className="library-manage">
      <summary>Manage space</summary>
      <WorkspaceCreate onCreated={onCreated} />
      {managing ? <WorkspaceMemberAdd key={workspaceId} workspaceId={workspaceId} /> : null}
      <WorkspaceLeave key={workspaceId} workspaceId={workspaceId} />
      {managing ? <WorkspaceDelete key={workspaceId} workspaceId={workspaceId} /> : null}
    </details>
  );
}
