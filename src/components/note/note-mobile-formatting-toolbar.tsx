"use client";

import { PortalElementOverride } from "@blocknote/react";
import { NoteMobileFormattingBar } from "@/components/note/note-mobile-formatting-bar";

export function NoteMobileFormattingToolbar() {
  return (
    <PortalElementOverride target={document.body}>
      <NoteMobileFormattingBar />
    </PortalElementOverride>
  );
}
