"use client";

import { useQuery } from "@tanstack/react-query";
import { useLibraryShell } from "@/components/library/library-shell";
import { openWorkspaceName } from "@/lib/library-spaces";
import { workspacesQueryOptions } from "@/lib/library-workspaces";
import { Paragraph } from "@/ui/Paragraph";

export function WorkspaceSettingsNameReadout() {
  const shell = useLibraryShell();
  const spaces = useQuery({
    ...workspacesQueryOptions(),
    initialData: shell.workspaces,
  });
  const name = openWorkspaceName(shell.workspaceId, spaces.data) || "Workspace";

  return (
    <div className="workspace-name-readout">
      <p>Workspace name</p>
      <Paragraph>{name}</Paragraph>
      <Paragraph className="hint">Shown to everyone in this workspace.</Paragraph>
    </div>
  );
}
