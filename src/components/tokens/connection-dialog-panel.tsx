"use client";

import { useEffect, useId, useRef } from "react";
import { ConnectChooser } from "@/components/connect/connect-chooser";

interface Properties {
  onClose: () => void;
}

export function ConnectionDialogPanel(props: Properties) {
  const { onClose } = props;
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const node = panelRef.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    node?.querySelector<HTMLElement>("button")?.focus();

    function onKey(event: KeyboardEvent) {
      if (!node) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [...node.querySelectorAll<HTMLElement>("button, input, select, a")].filter(
        (item) => !item.hasAttribute("disabled"),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, []);

  return (
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className="share-dialog token-connect-dialog token-connect"
      onClick={(event) => event.stopPropagation()}
      ref={panelRef}
      role="dialog"
      tabIndex={-1}
    >
      <ConnectChooser onClose={onClose} titleId={titleId} />
    </div>
  );
}
