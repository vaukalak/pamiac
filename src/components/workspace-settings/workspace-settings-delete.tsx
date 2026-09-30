"use client";

import { useLibraryShell } from "@/components/library/library-shell";
import { WorkspaceSettingsDeleteActions } from "@/components/workspace-settings/workspace-settings-delete-actions";
import { WorkspaceSettingsDeleteCopy } from "@/components/workspace-settings/workspace-settings-delete-copy";
import { PERSONAL_SPACE_ID } from "@/lib/library-spaces";

export function WorkspaceSettingsDelete() {
  const shell = useLibraryShell();

  if (shell.workspaceId === PERSONAL_SPACE_ID) return null;

  return (
    <div className="workspace-danger-row">
      <WorkspaceSettingsDeleteCopy />
      <WorkspaceSettingsDeleteActions />
    </div>
  );
}
