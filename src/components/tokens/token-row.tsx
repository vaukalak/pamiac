"use client";

import { useState } from "react";
import type { AgentToken } from "@/components/tokens/agent-token";
import { TokenRowExpanded } from "@/components/tokens/token-row-expanded";
import { TokenRowSummary } from "@/components/tokens/token-row-summary";

interface Properties {
  token: AgentToken;
}

export function TokenRow(props: Properties) {
  const { token } = props;
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <TokenRowSummary
        expanded={expanded}
        onToggle={() => setExpanded((value) => !value)}
        token={token}
      />
      {expanded ? <TokenRowExpanded token={token} /> : null}
    </>
  );
}
