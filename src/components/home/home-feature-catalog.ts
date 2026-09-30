export const homeFeatures = [
  {
    id: "rich-notes",
    label: "Rich notes",
    description: "Turn rough thoughts into structured, shareable documents.",
  },
  {
    id: "agent-access",
    label: "Agent access",
    description: "Let agents search, create, and update your workspace.",
  },
  {
    id: "workspaces",
    label: "Personal and team workspaces",
    description: "A private desk, and named workspaces you can invite people into.",
  },
] as const;

export type HomeFeatureId = (typeof homeFeatures)[number]["id"];

export const homeFeaturePanelId = "home-feature-panel";

export function homeFeatureTabId(id: HomeFeatureId) {
  return `home-tab-${id}`;
}
