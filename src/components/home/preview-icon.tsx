import { HOME_ICON_PATHS, type HomeIconName } from "@/components/home/home-icons";

interface Properties {
  name: HomeIconName;
  className?: string;
}

export function PreviewIcon(props: Properties) {
  const { name, className } = props;

  return (
    <svg
      className={className ? `home-preview-icon ${className}` : "home-preview-icon"}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d={HOME_ICON_PATHS[name]} />
    </svg>
  );
}
