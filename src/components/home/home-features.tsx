"use client";

import { type KeyboardEvent } from "react";
import {
  HomeFeatureCard,
  type HomeFeature,
  type HomeFeatureId,
} from "@/components/home/home-feature-card";

const FEATURES: HomeFeature[] = [
  {
    id: "notes",
    icon: "notes",
    title: "Rich notes",
    text: "Turn rough thoughts into structured, shareable documents.",
  },
  {
    id: "agent",
    icon: "agent",
    title: "Agent access",
    text: "Let agents search, create, and update your workspace.",
  },
  {
    id: "workspaces",
    icon: "library",
    title: "Personal and team workspaces",
    text: "A private desk, and named workspaces you can invite people into.",
  },
];

interface Properties {
  selected: HomeFeatureId;
  onSelect: (id: HomeFeatureId) => void;
}

function nextFeatureId(selected: HomeFeatureId, key: string): HomeFeatureId | null {
  const index = FEATURES.findIndex((feature) => feature.id === selected);
  if (key === "Home") return FEATURES[0].id;
  if (key === "End") return FEATURES[FEATURES.length - 1].id;
  if (key === "ArrowRight" || key === "ArrowDown") {
    return FEATURES[(index + 1) % FEATURES.length].id;
  }
  if (key === "ArrowLeft" || key === "ArrowUp") {
    return FEATURES[(index - 1 + FEATURES.length) % FEATURES.length].id;
  }
  return null;
}

export function HomeFeatures(props: Properties) {
  const { selected, onSelect } = props;

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const next = nextFeatureId(selected, event.key);
    if (!next) return;
    event.preventDefault();
    onSelect(next);
    document.getElementById(`home-tab-${next}`)?.focus();
  }

  return (
    <div
      className="home-features"
      role="tablist"
      aria-orientation="horizontal"
      aria-label="Features"
      onKeyDown={onKeyDown}
    >
      {FEATURES.map((feature) => (
        <HomeFeatureCard
          key={feature.id}
          feature={feature}
          selected={feature.id === selected}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
