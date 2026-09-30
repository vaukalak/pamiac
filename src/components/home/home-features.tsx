import { HomeFeatureCard, type HomeFeature } from "@/components/home/home-feature-card";

const FEATURES: HomeFeature[] = [
  {
    icon: "canvas",
    title: "UML canvas",
    text: "Draw, connect, and explore ideas on a flexible canvas.",
  },
  {
    icon: "notes",
    title: "Rich notes",
    text: "Turn rough thoughts into structured, shareable documents.",
  },
  {
    icon: "agent",
    title: "Agent access",
    text: "Let agents search, create, and update your workspace.",
  },
];

export function HomeFeatures() {
  return (
    <div className="home-features">
      {FEATURES.map((feature) => (
        <HomeFeatureCard key={feature.title} feature={feature} />
      ))}
    </div>
  );
}
