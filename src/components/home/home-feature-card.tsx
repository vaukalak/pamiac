"use client";

import { HomeFeatureIcon } from "@/components/home/home-feature-icon";
import type { HomeIconName } from "@/components/home/home-icons";

export type HomeFeatureId = "notes" | "agent" | "workspaces";

export interface HomeFeature {
  id: HomeFeatureId;
  icon: HomeIconName;
  title: string;
  text: string;
}

interface Properties {
  feature: HomeFeature;
  selected: boolean;
  onSelect: (id: HomeFeatureId) => void;
}

export function HomeFeatureCard(props: Properties) {
  const { feature, selected, onSelect } = props;

  return (
    <button
      type="button"
      role="tab"
      id={`home-tab-${feature.id}`}
      className="home-feature"
      aria-selected={selected}
      aria-controls="home-preview-panel"
      tabIndex={selected ? 0 : -1}
      onClick={() => onSelect(feature.id)}
    >
      <HomeFeatureIcon name={feature.icon} />
      <h2>{feature.title}</h2>
      <p>{feature.text}</p>
    </button>
  );
}
