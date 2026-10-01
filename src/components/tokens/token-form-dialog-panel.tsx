"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { TokenFormDialogHeading } from "@/components/tokens/token-form-dialog-heading";

interface Properties {
  children: ReactNode;
  onClose: () => void;
  title: string;
}

export function TokenFormDialogPanel(props: Properties) {
  const { children, onClose, title } = props;
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
      if (node.querySelector(".share-backdrop")) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [
        ...node.querySelectorAll<HTMLElement>("button, input, select, textarea, a"),
      ].filter((item) => !item.hasAttribute("disabled"));
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
      className="share-dialog token-form-dialog"
      onClick={(event) => event.stopPropagation()}
      ref={panelRef}
      role="dialog"
      tabIndex={-1}
    >
      <TokenFormDialogHeading onClose={onClose} title={title} titleId={titleId} />
      {children}
    </div>
  );
}
