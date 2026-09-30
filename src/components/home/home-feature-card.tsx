import { HomeFeatureIcon } from "@/components/home/home-feature-icon";
import type { HomeIconName } from "@/components/home/home-icons";

export interface HomeFeature {
  icon: HomeIconName;
  title: string;
  text: string;
}

interface Properties {
  feature: HomeFeature;
}

export function HomeFeatureCard(props: Properties) {
  const { feature } = props;

  return (
    <article className="home-feature">
      <HomeFeatureIcon name={feature.icon} />
      <h2>{feature.title}</h2>
      <p>{feature.text}</p>
    </article>
  );
}
