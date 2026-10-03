"use client";

import { useState } from "react";
import { ConnectAgentLinkRow } from "@/components/connect/connect-agent-link-row";
import { AGENT_CONNECT_URL } from "@/lib/connect-platforms";
import { Alert } from "@/ui/Alert";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  label?: string;
  hint?: string;
}

export function ConnectAgentLink(props: Properties) {
  const { label, hint } = props;
  const [message, setMessage] = useState("");

  async function copyLink() {
    setMessage("");
    try {
      await navigator.clipboard.writeText(AGENT_CONNECT_URL);
      setMessage("Link copied.");
    } catch {
      setMessage("Could not copy the link.");
    }
  }

  return (
    <div className="token-connect-link">
      {label ? <Paragraph>{label}</Paragraph> : null}
      <ConnectAgentLinkRow onCopy={() => void copyLink()} />
      {hint ? <Paragraph>{hint}</Paragraph> : null}
      {message === "Could not copy the link." ? <Alert>{message}</Alert> : null}
      {message === "Link copied." ? (
        <p className="text-pretty" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
