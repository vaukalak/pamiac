"use client";

import { useState, type ReactNode } from "react";
import {
  homeFeaturePanelId,
  homeFeatureTabId,
  type HomeFeatureId,
} from "@/components/home/home-feature-catalog";
import { HomeFeatureColumn } from "@/components/home/home-feature-column";
import { HomeFeaturePanel } from "@/components/home/home-feature-panel";

interface Properties {
  children: ReactNode;
}

export function HomeFeatures(props: Properties) {
  const { children } = props;
  const [selectedId, setSelectedId] = useState<HomeFeatureId>("rich-notes");

  return (
    <>
      <HomeFeatureColumn onSelect={setSelectedId} selectedId={selectedId}>
        {children}
      </HomeFeatureColumn>
      <HomeFeaturePanel
        featureId={selectedId}
        labelledBy={homeFeatureTabId(selectedId)}
        panelId={homeFeaturePanelId}
      />
    </>
  );
}
