"use client";

import { useState } from "react";
import type { AgentToken } from "@/components/tokens/agent-token";
import { TokenRowSummary } from "@/components/tokens/token-row-summary";
import { TokenUpdateDialog } from "@/components/tokens/token-update-dialog";

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
      {expanded ? <TokenUpdateDialog onClose={() => setExpanded(false)} token={token} /> : null}
    </>
  );
}
