"use client";

import { useEffect, useRef } from "react";
import { NoteNotifyPanel } from "@/components/note-notify/note-notify-panel";

interface Properties {
  documentId: string;
  onClose: () => void;
}

function holdOutside(backdrop: HTMLElement) {
  const restored: HTMLElement[] = [];
  let current: HTMLElement | null = backdrop;
  while (current) {
    const parent: HTMLElement | null = current.parentElement;
    if (!parent) break;
    for (const child of parent.children) {
      if (child !== current && child instanceof HTMLElement && !child.inert) {
        child.inert = true;
        restored.push(child);
      }
    }
    if (parent === document.body) break;
    current = parent;
  }
  return function release() {
    for (const element of restored) element.inert = false;
  };
}

export function NoteNotifyDialog(props: Properties) {
  const { documentId, onClose } = props;
  const dialogRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const node = dialogRef.current;
    const backdrop = backdropRef.current;
    if (!node || !backdrop) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    node.querySelector<HTMLElement>("button, select, textarea")?.focus();
    const release = holdOutside(backdrop);

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !node) return;
      const focusable = [
        ...node.querySelectorAll<HTMLElement>("button, input, textarea, select, a[href]"),
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
      release();
      previous?.focus();
    };
  }, []);

  return (
    <div className="share-backdrop" onClick={onClose} ref={backdropRef} role="presentation">
      <NoteNotifyPanel dialogRef={dialogRef} documentId={documentId} onClose={onClose} />
    </div>
  );
}
