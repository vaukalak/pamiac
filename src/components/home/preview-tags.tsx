import { PreviewIcon } from "@/components/home/preview-icon";
import { PreviewTag } from "@/components/home/preview-tag";

const TAGS = ["product", "strategy", "agents"];

export function PreviewTags() {
  return (
    <div className="home-preview-tags">
      {TAGS.map((tag) => (
        <PreviewTag key={tag} label={tag} />
      ))}
      <PreviewIcon name="plus" className="home-preview-tag-add" />
    </div>
  );
}
