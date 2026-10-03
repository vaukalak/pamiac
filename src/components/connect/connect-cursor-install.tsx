"use client";

import { useState } from "react";
import { ConnectCursorFallback } from "@/components/connect/connect-cursor-fallback";
import { cursorInstallUrl } from "@/lib/connect-platforms";
import { Button } from "@/ui/Button";

interface Properties {
  onManual: () => void;
}

export function ConnectCursorInstall(props: Properties) {
  const { onManual } = props;
  const [opening, setOpening] = useState(false);
  const [unconfirmed, setUnconfirmed] = useState(false);

  function openCursor() {
    setOpening(true);
    setUnconfirmed(false);
    let left = false;
    function onHide() {
      if (document.visibilityState === "hidden") left = true;
    }
    document.addEventListener("visibilitychange", onHide);
    window.location.assign(cursorInstallUrl());
    window.setTimeout(() => {
      document.removeEventListener("visibilitychange", onHide);
      setOpening(false);
      if (!left) setUnconfirmed(true);
    }, 2000);
  }

  return (
    <div className="token-connect-action">
      <Button className="library-lime" onClick={openCursor} type="button">
        {opening ? "Opening Cursor…" : "Add Pamiac to Cursor"}
      </Button>
      {unconfirmed ? <ConnectCursorFallback onManual={onManual} /> : null}
    </div>
  );
}
