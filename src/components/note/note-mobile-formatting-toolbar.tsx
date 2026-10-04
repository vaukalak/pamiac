"use client";

import { PortalElementOverride } from "@blocknote/react";
import { NoteMobileFormattingBar } from "@/components/note/note-mobile-formatting-bar";

export function NoteMobileFormattingToolbar() {
  const shell = document.querySelector(".library-shell");
  if (!(shell instanceof HTMLElement)) return null;

  return (
    <PortalElementOverride target={shell}>
      <NoteMobileFormattingBar />
    </PortalElementOverride>
  );
}
