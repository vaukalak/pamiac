import type { HomeIconName } from "@/components/home/home-icons";
import { PreviewIcon } from "@/components/home/preview-icon";

export interface PreviewNavEntry {
  icon: HomeIconName;
  label: string;
  tone?: "active" | "pinned";
}

interface Properties {
  entry: PreviewNavEntry;
}

export function PreviewNavItem(props: Properties) {
  const { entry } = props;
  const className = entry.tone ? `home-preview-nav is-${entry.tone}` : "home-preview-nav";

  return (
    <div className={className}>
      <PreviewIcon name={entry.icon} />
      <span>{entry.label}</span>
    </div>
  );
}
