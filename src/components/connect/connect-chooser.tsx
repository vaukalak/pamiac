"use client";

import { useEffect, useState } from "react";
import { ConnectAdvanced } from "@/components/connect/connect-advanced";
import { ConnectPicker } from "@/components/connect/connect-picker";
import { ConnectPlatformFrame } from "@/components/connect/connect-platform-frame";
import { connectPlatform, type ConnectPlatformId } from "@/lib/connect-platforms";

interface Properties {
  embedded?: boolean;
  onClose?: () => void;
  titleId?: string;
}

type ConnectScreen =
  | { kind: "picker" }
  | { kind: "platform"; platformId: ConnectPlatformId }
  | { kind: "advanced"; platformId: ConnectPlatformId };

export function ConnectChooser(props: Properties) {
  const { embedded = false, onClose, titleId } = props;
  const [screen, setScreen] = useState<ConnectScreen>({ kind: "picker" });

  useEffect(() => {
    if (!titleId) return;
    const node = document.getElementById(titleId);
    node?.closest<HTMLElement>("[role=dialog]")?.querySelector<HTMLElement>("button")?.focus();
  }, [screen, titleId]);

  if (screen.kind === "advanced") {
    return (
      <ConnectAdvanced
        onBack={() => setScreen({ kind: "platform", platformId: screen.platformId })}
        onClose={onClose}
        onGuides={() => setScreen({ kind: "picker" })}
        titleId={titleId}
      />
    );
  }

  if (screen.kind === "platform") {
    return (
      <ConnectPlatformFrame
        onAdvanced={() => setScreen({ kind: "advanced", platformId: screen.platformId })}
        onBack={() => setScreen({ kind: "picker" })}
        onClose={onClose}
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
