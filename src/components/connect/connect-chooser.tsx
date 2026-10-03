"use client";

import { useEffect, useState } from "react";
import { ConnectAdvanced } from "@/components/connect/connect-advanced";
import { ConnectPicker } from "@/components/connect/connect-picker";
import { ConnectPlatformFrame } from "@/components/connect/connect-platform-frame";
import type { ConnectionTabId } from "@/components/tokens/connection-tabs";
import { connectPlatform, type ConnectPlatformId } from "@/lib/connect-platforms";

interface Properties {
  embedded?: boolean;
  initialPlatformId?: ConnectPlatformId;
  onClose?: () => void;
  titleId?: string;
}

type ConnectScreen =
  | { kind: "picker" }
  | { kind: "platform"; platformId: ConnectPlatformId }
  | { kind: "advanced"; platformId: ConnectPlatformId; tab: ConnectionTabId };

export function ConnectChooser(props: Properties) {
  const { embedded = false, initialPlatformId, onClose, titleId } = props;
  const [screen, setScreen] = useState<ConnectScreen>(
    initialPlatformId ? { kind: "platform", platformId: initialPlatformId } : { kind: "picker" },
  );

  useEffect(() => {
    if (!titleId) return;
    const node = document.getElementById(titleId);
    node?.closest<HTMLElement>("[role=dialog]")?.querySelector<HTMLElement>("button")?.focus();
  }, [screen, titleId]);

  if (screen.kind === "advanced") {
    return (
      <ConnectAdvanced
        initialTab={screen.tab}
        onBack={() => setScreen({ kind: "platform", platformId: screen.platformId })}
        onClose={onClose}
        onGuides={() => setScreen({ kind: "picker" })}
        platformId={screen.platformId}
        titleId={titleId}
      />
    );
  }

  if (screen.kind === "platform") {
    return (
      <ConnectPlatformFrame
        onAdvanced={() =>
          setScreen({ kind: "advanced", platformId: screen.platformId, tab: "token" })
        }
        onBack={() => setScreen({ kind: "picker" })}
        onClose={onClose}
        onManual={() => setScreen({ kind: "advanced", platformId: screen.platformId, tab: "mcp" })}
        platform={connectPlatform(screen.platformId)}
        titleId={titleId}
      />
    );
  }

  return (
    <ConnectPicker
      onClose={onClose}
      onPlatform={(platformId) => setScreen({ kind: "platform", platformId })}
      showHeading={!embedded}
      titleId={titleId}
    />
  );
}
