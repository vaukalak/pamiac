import type { HomeFeatureId } from "@/components/home/home-feature-card";
import { PreviewBar } from "@/components/home/preview-bar";
import { PreviewBody } from "@/components/home/preview-body";

const SPACE_LABEL: Record<HomeFeatureId, string> = {
  notes: "Notes",
  agent: "Agents",
  workspaces: "Field notes",
};

interface Properties {
  selected: HomeFeatureId;
}

export function WorkspacePreview(props: Properties) {
  const { selected } = props;

  return (
    <div
      className="home-preview"
      id="home-preview-panel"
      role="tabpanel"
      aria-labelledby={`home-tab-${selected}`}
      tabIndex={0}
    >
      <PreviewBar space={SPACE_LABEL[selected]} />
      <PreviewBody selected={selected} />
    </div>
  );
}
