"use client";

import { useState } from "react";
import { ConnectApiTokenGuide } from "@/components/connect/connect-api-token-guide";
import { ConnectTokenCreated } from "@/components/connect/connect-token-created";
import { ConnectTokenExample } from "@/components/connect/connect-token-example";
import { TokenCreateForm } from "@/components/tokens/token-create-form";
import type { Expiration } from "@/components/tokens/token-values";
import { connectTokenName, type ConnectPlatformId } from "@/lib/connect-platforms";

const CONNECT_SCOPE_OPTIONS = [
  { value: "all" as const, label: "All my spaces" },
  { value: "selected" as const, label: "Selected workspaces" },
];

const CONNECT_EXPIRATIONS: readonly { value: Expiration; label: string }[] = [
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "1y", label: "1 year" },
  { value: "never", label: "Never" },
];

interface Properties {
  onGuides: () => void;
  platformId: ConnectPlatformId;
}

export function ConnectApiTokenFields(props: Properties) {
  const { onGuides, platformId } = props;
  const [secret, setSecret] = useState("");
  const [finished, setFinished] = useState(false);

  if (secret) {
    return (
      <ConnectTokenCreated
        onDone={() => {
          setSecret("");
          setFinished(true);
        }}
        secret={secret}
      />
    );
  }

  return (
    <div className="token-connect-token-grid">
      {finished ? <ConnectTokenExample /> : null}
      <TokenCreateForm
        defaultExpiration="90d"
        defaultName={connectTokenName(platformId)}
        expirationLabel="Expires"
        expirations={CONNECT_EXPIRATIONS}
        failureMessage="Couldn't create the token. Try again."
        idPrefix="connect-token"
        namePlaceholder={connectTokenName(platformId)}
        onCreated={setSecret}
        scopeLabel="Access"
        scopeOptions={CONNECT_SCOPE_OPTIONS}
        submitLabel="Create token"
        suppressSecret
      />
      <ConnectApiTokenGuide onGuides={onGuides} />
    </div>
  );
}
