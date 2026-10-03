"use client";

import { UIModeContext, usePortalElement } from "@blocknote/react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { NoteFormattingToolbar } from "@/components/note/note-formatting-toolbar";

export function NoteMobileFormattingBar() {
  const portalElement = usePortalElement();
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = bar.current;
    if (!element) return;
    const html = document.documentElement;
    const write = () => {
      html.style.setProperty("--note-formatting-bar", `${element.offsetHeight}px`);
    };
    write();
    const observer = new ResizeObserver(write);
    observer.observe(element);
    return () => {
      observer.disconnect();
      html.style.removeProperty("--note-formatting-bar");
    };
  }, [portalElement]);

  if (!portalElement) return null;

  return (
    <UIModeContext.Provider value="mobile">
      {createPortal(
        <div className="bn-mobile-formatting-toolbar" ref={bar}>
          <NoteFormattingToolbar />
        </div>,
        portalElement,
      )}
    </UIModeContext.Provider>
  );
}
