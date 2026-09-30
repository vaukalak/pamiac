import type { HomeFeatureId } from "@/components/home/home-feature-card";
import { PreviewGraph } from "@/components/home/preview-graph";
import { PreviewNote } from "@/components/home/preview-note";
import { PreviewSpaces } from "@/components/home/preview-spaces";

interface Properties {
  selected: HomeFeatureId;
}

export function PreviewStage(props: Properties) {
  const { selected } = props;

  return (
    <div className={`home-preview-stage home-preview-scene is-${selected}`}>
      {selected === "notes" ? <PreviewNote /> : null}
      {selected === "agent" ? <PreviewGraph /> : null}
      {selected === "workspaces" ? <PreviewSpaces /> : null}
    </div>
  );
}
