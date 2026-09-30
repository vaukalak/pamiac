"use client";

import { LibraryShell } from "@/components/library/library-shell";
import { WorkspaceSettingsBody } from "@/components/workspace-settings/workspace-settings-body";
import type { NamedWorkspace } from "@/lib/library-spaces";

interface Properties {
  email: string;
  workspaces: NamedWorkspace[];
}

export function WorkspaceSettingsScreen(props: Properties) {
  const { email, workspaces } = props;

  return (
    <LibraryShell email={email} page="settings" workspaces={workspaces}>
      <WorkspaceSettingsBody />
    </LibraryShell>
  );
}
