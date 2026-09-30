import { PreviewIcon } from "@/components/home/preview-icon";

export function PreviewBar() {
  return (
    <div className="home-preview-bar">
      <PreviewIcon name="mark" className="home-preview-mark" />
      <span className="home-preview-brand">Pamiac</span>
      <span className="home-preview-space">Personal workspace</span>
      <span className="home-preview-status" />
    </div>
  );
}
