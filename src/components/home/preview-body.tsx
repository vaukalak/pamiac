import type { HomeFeatureId } from "@/components/home/home-feature-card";
import { PreviewSidebar } from "@/components/home/preview-sidebar";
import { PreviewStage } from "@/components/home/preview-stage";

const SIDEBAR_ACTIVE: Record<HomeFeatureId, string> = {
  notes: "Notes",
  agent: "Agents",
  workspaces: "Home",
};

interface Properties {
  selected: HomeFeatureId;
}

export function PreviewBody(props: Properties) {
  const { selected } = props;

  return (
    <div className="home-preview-body">
      <PreviewSidebar active={SIDEBAR_ACTIVE[selected]} />
      <PreviewStage key={selected} selected={selected} />
    </div>
  );
}
