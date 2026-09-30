import type { HomeIconName } from "@/components/home/home-icons";
import { PreviewIcon } from "@/components/home/preview-icon";

export interface PreviewSpace {
  icon: HomeIconName;
  name: string;
  detail: string;
  open?: boolean;
}

interface Properties {
  space: PreviewSpace;
}

export function PreviewSpaceCard(props: Properties) {
  const { space } = props;
  const className = space.open ? "home-preview-desk is-open" : "home-preview-desk";

  return (
    <div className={className}>
      <PreviewIcon name={space.icon} />
      <strong>{space.name}</strong>
      <span>{space.detail}</span>
    </div>
  );
}
