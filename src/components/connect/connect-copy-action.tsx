"use client";

import { useState } from "react";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";

interface Properties {
  className?: string;
  failure: string;
  label: string;
  success: string;
  text: string;
}

export function ConnectCopyAction(props: Properties) {
  const { className = "secondary", failure, label, success, text } = props;
  const [message, setMessage] = useState("");

  async function copyText() {
    setMessage("");
    try {
      await navigator.clipboard.writeText(text);
      setMessage(success);
    } catch {
      setMessage(failure);
    }
  }

  return (
    <div className="token-connect-action">
      <Button className={className} onClick={() => void copyText()} type="button">
        {label}
      </Button>
      {message === failure ? <Alert>{message}</Alert> : null}
      {message === success ? (
        <p className="text-pretty" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
