"use client";

import { ConnectionTabButton } from "@/components/tokens/connection-tab-button";

export const CONNECTION_TABS = [
  ["token", "API token"],
  ["mcp", "Manual MCP"],
  ["skill", "Agent skill"],
] as const;

export type ConnectionTabId = (typeof CONNECTION_TABS)[number][0];

interface Properties {
  tab: ConnectionTabId;
  onTab: (tab: ConnectionTabId) => void;
}

export function ConnectionTabs(props: Properties) {
  const { tab, onTab } = props;

  return (
    <div aria-label="Advanced options" className="token-connect-tabs" role="group">
      {CONNECTION_TABS.map(([value, label]) => (
        <ConnectionTabButton
          key={value}
          label={label}
          onSelect={() => onTab(value)}
          pressed={tab === value}
        />
      ))}
    </div>
  );
}
