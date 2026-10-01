"use client";

import { useLibraryShell } from "@/components/library/library-shell";
import { WorkspaceSettingsHeading } from "@/components/workspace-settings/workspace-settings-heading";
import { WorkspaceSettingsNamed } from "@/components/workspace-settings/workspace-settings-named";
import { WorkspaceSettingsPersonal } from "@/components/workspace-settings/workspace-settings-personal";
import { PERSONAL_SPACE_ID } from "@/lib/library-spaces";

export function WorkspaceSettingsBody() {
  const shell = useLibraryShell();
  const personal = shell.workspaceId === PERSONAL_SPACE_ID;

  return (
    <>
      <WorkspaceSettingsHeading />
      {personal ? <WorkspaceSettingsPersonal /> : <WorkspaceSettingsNamed />}
    </>
  );
}
