"use client";

import { useState } from "react";
import { AGENT_CONNECT_URL } from "@/lib/connect-platforms";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";

interface Properties {
  label: string;
}

export function ConnectPlatformAction(props: Properties) {
  const { label } = props;
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
    <div className="token-connect-action">
      <Button className="library-lime" onClick={() => void copyLink()} type="button">
        {label}
      </Button>
      {message === "Could not copy the link." ? <Alert>{message}</Alert> : null}
      {message === "Link copied." ? (
        <p className="text-pretty" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
