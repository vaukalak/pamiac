import { PreviewIcon } from "@/components/home/preview-icon";
import { PreviewNoteLine } from "@/components/home/preview-note-line";
import { PreviewTags } from "@/components/home/preview-tags";

const LINES = ["Expand agent capabilities", "Improve diagramming experience", "Ship v1.0"];

export function PreviewNote() {
  return (
    <div className="home-preview-note">
      <PreviewIcon name="more" className="home-preview-more" />
      <h3>Product strategy</h3>
      <p className="home-preview-meta">Note · Edited just now</p>
      <p className="home-preview-text">
        Define our next phase of product development, focusing on a more collaborative workflow
        between humans and AI agents.
      </p>
      {LINES.map((line) => (
        <PreviewNoteLine key={line} text={line} />
      ))}
      <PreviewTags />
    </div>
  );
}
