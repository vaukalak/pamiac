"use client";

import { useState } from "react";
import { ConnectClaudeCode } from "@/components/connect/connect-claude-code";
import {
  ConnectClaudeMode,
  type ClaudeConnectMode,
} from "@/components/connect/connect-claude-mode";
import { ConnectClaudeWeb } from "@/components/connect/connect-claude-web";
import type { ConnectPlatform } from "@/lib/connect-platforms";

interface Properties {
  onAdvanced: () => void;
  platform: ConnectPlatform;
}

export function ConnectClaudeSetup(props: Properties) {
  const { onAdvanced, platform } = props;
  const [mode, setMode] = useState<ClaudeConnectMode>("web");

  return (
    <div className="token-connect-setup">
      <ConnectClaudeMode mode={mode} onMode={setMode} />
      {mode === "web" ? (
        <ConnectClaudeWeb onAdvanced={onAdvanced} platform={platform} />
      ) : (
        <ConnectClaudeCode onAdvanced={onAdvanced} />
      )}
    </div>
  );
}
