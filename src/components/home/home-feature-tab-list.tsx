"use client";

import type { KeyboardEvent } from "react";
import {
  homeFeaturePanelId,
  homeFeatureTabId,
  homeFeatures,
  type HomeFeatureId,
} from "@/components/home/home-feature-catalog";
import { HomeFeatureTab } from "@/components/home/home-feature-tab";

interface Properties {
  selectedId: HomeFeatureId;
  onSelect: (id: HomeFeatureId) => void;
}

function nextFeatureIndex(current: number, key: string) {
  const last = homeFeatures.length - 1;

  if (key === "Home") return 0;
  if (key === "End") return last;
  if (key === "ArrowDown" || key === "ArrowRight") return current === last ? 0 : current + 1;
  if (key === "ArrowUp" || key === "ArrowLeft") return current === 0 ? last : current - 1;

  return current;
}

export function HomeFeatureTabList(props: Properties) {
  const { selectedId, onSelect } = props;

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const keys = ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Home", "End"];
    if (!keys.includes(event.key)) return;

    event.preventDefault();
    const current = homeFeatures.findIndex((feature) => feature.id === selectedId);
    const feature = homeFeatures[nextFeatureIndex(current, event.key)];
    onSelect(feature.id);
    const tab = event.currentTarget.querySelector<HTMLButtonElement>(
      `#${homeFeatureTabId(feature.id)}`,
    );
    tab?.focus();
  }

  return (
    <div
      aria-label="Features"
      aria-orientation="vertical"
      className="hero-tabs"
      onKeyDown={onKeyDown}
      role="tablist"
    >
      {homeFeatures.map((feature) => (
        <HomeFeatureTab
          controls={homeFeaturePanelId}
          description={feature.description}
          key={feature.id}
          label={feature.label}
          onSelect={() => onSelect(feature.id)}
          selected={feature.id === selectedId}
          tabId={homeFeatureTabId(feature.id)}
        />
      ))}
    </div>
  );
}
