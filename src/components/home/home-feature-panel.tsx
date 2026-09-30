import { AgentAccessPicture } from "@/components/home/agent-access-picture";
import type { HomeFeatureId } from "@/components/home/home-feature-catalog";
import { RichNotesPicture } from "@/components/home/rich-notes-picture";
import { WorkspacesPicture } from "@/components/home/workspaces-picture";

interface Properties {
  featureId: HomeFeatureId;
  labelledBy: string;
  panelId: string;
}

export function HomeFeaturePanel(props: Properties) {
  const { featureId, labelledBy, panelId } = props;

  return (
    <div
      aria-labelledby={labelledBy}
      className="hero-preview"
      id={panelId}
      role="tabpanel"
      tabIndex={0}
    >
      {featureId === "rich-notes" ? <RichNotesPicture /> : null}
      {featureId === "agent-access" ? <AgentAccessPicture /> : null}
      {featureId === "workspaces" ? <WorkspacesPicture /> : null}
    </div>
  );
}
