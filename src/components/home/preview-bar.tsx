import { PreviewIcon } from "@/components/home/preview-icon";

interface Properties {
  space: string;
}

export function PreviewBar(props: Properties) {
  const { space } = props;

  return (
    <div className="home-preview-bar">
      <PreviewIcon name="mark" className="home-preview-mark" />
      <span className="home-preview-brand">Pamiac</span>
      <span className="home-preview-space">{space}</span>
      <span className="home-preview-status" />
    </div>
  );
}
