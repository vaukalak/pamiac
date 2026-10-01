import { WorkspaceSettingsDanger } from "@/components/workspace-settings/workspace-settings-danger";
import { WorkspaceSettingsDetails } from "@/components/workspace-settings/workspace-settings-details";

export function WorkspaceSettingsNamed() {
  return (
    <>
      <WorkspaceSettingsDetails />
      <WorkspaceSettingsDanger />
    </>
  );
}
