import { HomeHero } from "@/components/home/home-hero";
import type { HomeFeatureId } from "@/components/home/home-feature-card";
import { WorkspacePreview } from "@/components/home/workspace-preview";

interface Properties {
  selected: HomeFeatureId;
}

export function HomeHeroSection(props: Properties) {
  const { selected } = props;

  return (
    <section className="home-hero">
      <HomeHero />
      <WorkspacePreview selected={selected} />
    </section>
  );
}
