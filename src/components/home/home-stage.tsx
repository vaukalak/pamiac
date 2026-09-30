"use client";

import { useState } from "react";
import { HomeFeatures } from "@/components/home/home-features";
import { HomeHeroSection } from "@/components/home/home-hero-section";
import type { HomeFeatureId } from "@/components/home/home-feature-card";

export function HomeStage() {
  const [selected, setSelected] = useState<HomeFeatureId>("notes");

  return (
    <>
      <HomeHeroSection selected={selected} />
      <HomeFeatures selected={selected} onSelect={setSelected} />
    </>
  );
}
