"use client";

import { UIModeContext, usePortalElement } from "@blocknote/react";
import { createPortal } from "react-dom";
import { NoteFormattingToolbar } from "@/components/note/note-formatting-toolbar";

export function NoteMobileFormattingBar() {
  const portalElement = usePortalElement();

  if (!portalElement) return null;

  return (
    <UIModeContext.Provider value="mobile">
      {createPortal(
        <div className="bn-mobile-formatting-toolbar">
          <NoteFormattingToolbar />
        </div>,
        portalElement,
      )}
    </UIModeContext.Provider>
  );
}
