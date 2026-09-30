import { HOME_ICON_PATHS, type HomeIconName } from "@/components/home/home-icons";

interface Properties {
  name: HomeIconName;
}

export function HomeFeatureIcon(props: Properties) {
  const { name } = props;

  return (
    <svg className="home-feature-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={HOME_ICON_PATHS[name]} />
    </svg>
  );
}
