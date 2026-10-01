"use client";

import { useQuery } from "@tanstack/react-query";
import { useLibraryShell } from "@/components/library/library-shell";
import { WorkspaceSettingsDelete } from "@/components/workspace-settings/workspace-settings-delete";
import { WorkspaceSettingsLeave } from "@/components/workspace-settings/workspace-settings-leave";
import { managesWorkspace, PERSONAL_SPACE_ID } from "@/lib/library-spaces";
import { workspacesQueryOptions } from "@/lib/library-workspaces";
import { Section } from "@/ui/Section";

export function WorkspaceSettingsDanger() {
  const shell = useLibraryShell();
  const spaces = useQuery({
    ...workspacesQueryOptions(),
    initialData: shell.workspaces,
  });
  const managing = managesWorkspace(shell.workspaceId, spaces.data ?? []);

  if (shell.workspaceId === PERSONAL_SPACE_ID) return null;

  return (
    <Section className="workspace-danger">
      <h2>Danger zone</h2>
      <WorkspaceSettingsLeave />
      {managing ? <WorkspaceSettingsDelete /> : null}
    </Section>
  );
}
