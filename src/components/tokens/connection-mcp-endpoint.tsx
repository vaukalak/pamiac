"use client";

import { useEffect, useState } from "react";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";

export function ConnectionMcpEndpoint() {
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setUrl(`${window.location.origin}/api/mcp`);
  }, []);

  async function copyLink() {
    setMessage("");
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Link copied.");
    } catch {
      setMessage("Could not copy the link.");
    }
  }

  if (!url) return null;

  return (
    <div className="token-connect-endpoint">
      <a className="dev-link" href={url}>
        {url}
      </a>
      <Button className="secondary" onClick={() => void copyLink()} type="button">
        Copy link
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
