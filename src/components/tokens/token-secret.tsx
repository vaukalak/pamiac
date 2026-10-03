"use client";

import { useState } from "react";
import { TokenSecretRow } from "@/components/tokens/token-secret-row";
import { Alert } from "@/ui/Alert";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  secret: string;
}

export function TokenSecret(props: Properties) {
  const { secret } = props;
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");

  return (
    <div className="token-secret">
      <Paragraph>
        This API key is shown once. Copy it now. Set PAMIAC_TOKEN to this value.
      </Paragraph>
      <TokenSecretRow
        onResult={setMessage}
        onToggle={() => setVisible((current) => !current)}
        secret={secret}
        visible={visible}
      />
      {message === "Could not copy the key." ? <Alert>{message}</Alert> : null}
      {message === "Key copied." ? (
        <p className="text-pretty" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
