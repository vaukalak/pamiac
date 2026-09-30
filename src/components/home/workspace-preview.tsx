import { PreviewBar } from "@/components/home/preview-bar";
import { PreviewGraph } from "@/components/home/preview-graph";
import { PreviewNote } from "@/components/home/preview-note";
import { PreviewSidebar } from "@/components/home/preview-sidebar";

export function WorkspacePreview() {
  return (
    <div className="home-preview" aria-hidden="true">
      <PreviewBar />
      <div className="home-preview-body">
        <PreviewSidebar />
        <PreviewGraph />
        <PreviewNote />
      </div>
    </div>
  );
}
