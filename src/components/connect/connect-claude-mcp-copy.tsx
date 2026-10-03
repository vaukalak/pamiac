"use client";

import { useEffect, useState } from "react";
import { ConnectCopyAction } from "@/components/connect/connect-copy-action";
import { ConnectPromptText } from "@/components/connect/connect-prompt-text";

export function ConnectClaudeMcpCopy() {
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(`${window.location.origin}/api/mcp`);
  }, []);

  if (!url) return null;

  return (
    <div className="token-connect-claude-mcp">
      <ConnectPromptText text={url} />
      <ConnectCopyAction
        className="library-lime"
        failure="Could not copy the link."
        label="Copy MCP URL"
        success="Link copied."
        text={url}
      />
    </div>
  );
}
