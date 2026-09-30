import type { ReactNode } from "react";
import type { HomeFeatureId } from "@/components/home/home-feature-catalog";
import { HomeFeatureTabList } from "@/components/home/home-feature-tab-list";

interface Properties {
  children: ReactNode;
  selectedId: HomeFeatureId;
  onSelect: (id: HomeFeatureId) => void;
}

export function HomeFeatureColumn(props: Properties) {
  const { children, selectedId, onSelect } = props;

  return (
    <div className="hero-copy">
      {children}
      <HomeFeatureTabList onSelect={onSelect} selectedId={selectedId} />
    </div>
  );
}
