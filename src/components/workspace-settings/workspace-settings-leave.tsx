"use client";

import { WorkspaceSettingsLeaveActions } from "@/components/workspace-settings/workspace-settings-leave-actions";
import { WorkspaceSettingsLeaveCopy } from "@/components/workspace-settings/workspace-settings-leave-copy";
import { useLibraryShell } from "@/components/library/library-shell";
import { PERSONAL_SPACE_ID } from "@/lib/library-spaces";

export function WorkspaceSettingsLeave() {
  const shell = useLibraryShell();

  if (shell.workspaceId === PERSONAL_SPACE_ID) return null;

  return (
    <div className="workspace-danger-row">
      <WorkspaceSettingsLeaveCopy />
      <WorkspaceSettingsLeaveActions />
    </div>
  );
}
