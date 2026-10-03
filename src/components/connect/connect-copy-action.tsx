"use client";

import { useEffect, useState } from "react";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";

const COPY_FAILURE = "Couldn't copy automatically. Select and copy the value manually.";

interface Properties {
  className?: string;
  copiedStatus?: string;
  label: string;
  text: string;
}

export function ConnectCopyAction(props: Properties) {
  const { className = "secondary", copiedStatus, label, text } = props;
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copyText() {
    setFailed(false);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
      setFailed(true);
    }
  }

  return (
    <div className="token-connect-action">
      <Button className={className} onClick={() => void copyText()} type="button">
        {copied ? "Copied" : label}
      </Button>
      {failed ? <Alert>{COPY_FAILURE}</Alert> : null}
      {copied ? (
        <p className="text-pretty" role="status">
          {copiedStatus ?? "Copied"}
        </p>
      ) : null}
    </div>
  );
}
