"use client";

import { useQuery } from "@tanstack/react-query";
import { useLibraryShell } from "@/components/library/library-shell";
import { WorkspaceSettingsMark } from "@/components/workspace-settings/workspace-settings-mark";
import { WorkspaceSettingsNameForm } from "@/components/workspace-settings/workspace-settings-name-form";
import { WorkspaceSettingsNameReadout } from "@/components/workspace-settings/workspace-settings-name-readout";
import { managesWorkspace, openWorkspaceName } from "@/lib/library-spaces";
import { workspacesQueryOptions } from "@/lib/library-workspaces";
import { Section } from "@/ui/Section";

export function WorkspaceSettingsDetails() {
  const shell = useLibraryShell();
  const spaces = useQuery({
    ...workspacesQueryOptions(),
    initialData: shell.workspaces,
  });
  const name = openWorkspaceName(shell.workspaceId, spaces.data) || "Workspace";
  const managing = managesWorkspace(shell.workspaceId, spaces.data ?? []);

  return (
    <Section className="workspace-settings-card">
      <h2>Workspace details</h2>
      <WorkspaceSettingsMark name={name} />
      {managing ? (
        <WorkspaceSettingsNameForm key={shell.workspaceId} />
      ) : (
        <WorkspaceSettingsNameReadout />
      )}
    </Section>
  );
}
