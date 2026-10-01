"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ConnectionDialogHeading } from "@/components/tokens/connection-dialog-heading";
import { ConnectionPanel } from "@/components/tokens/connection-panel";
import { ConnectionTabs, type ConnectionTabId } from "@/components/tokens/connection-tabs";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  onClose: () => void;
}

export function ConnectionDialogPanel(props: Properties) {
  const { onClose } = props;
  const titleId = useId();
  const hintId = useId();
  const [tab, setTab] = useState<ConnectionTabId>("agent");
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
      const focusable = [...node.querySelectorAll<HTMLElement>("button, input, a")].filter(
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
      aria-describedby={hintId}
      aria-labelledby={titleId}
      aria-modal="true"
      className="share-dialog token-connect-dialog"
      onClick={(event) => event.stopPropagation()}
      ref={panelRef}
      role="dialog"
      tabIndex={-1}
    >
      <ConnectionDialogHeading onClose={onClose} titleId={titleId} />
      <Paragraph id={hintId}>Choose how to connect.</Paragraph>
      <ConnectionTabs onTab={setTab} tab={tab} />
      <ConnectionPanel tab={tab} />
    </div>
  );
}
