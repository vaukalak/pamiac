"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { LibrarySpaceAddHeading } from "@/components/library/library-space-add-heading";

interface Properties {
  form: ReactNode;
  onClose: () => void;
}

export function LibrarySpaceAddPanel(props: Properties) {
  const { form, onClose } = props;
  const onCloseRef = useRef(onClose);
  const panelRef = useRef<HTMLDivElement>(null);
  onCloseRef.current = onClose;

  useEffect(() => {
    const node = panelRef.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const field = node?.querySelector<HTMLInputElement>('input[name="name"]');
    if (field) field.focus();
    else node?.focus();

    function onKey(event: KeyboardEvent) {
      if (!node) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [...node.querySelectorAll<HTMLElement>("button, input")].filter(
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
      aria-labelledby="workspace-create-title"
      aria-modal="true"
      className="share-dialog"
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
      ref={panelRef}
      role="dialog"
      tabIndex={-1}
    >
      <LibrarySpaceAddHeading onClose={onClose} />
      {form}
    </div>
  );
}
