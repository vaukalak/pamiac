"use client";

import { useEffect, useRef, type MouseEvent, type RefObject } from "react";
import { NoteNotifyPanel } from "@/components/note-notify/note-notify-panel";

interface Properties {
  anchorRef: RefObject<HTMLElement | null>;
  documentId: string;
  modal: boolean;
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

export function NoteNotifyLayer(props: Properties) {
  const { anchorRef, documentId, modal, onClose } = props;
  const dialogRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const node = dialogRef.current;
    const backdrop = backdropRef.current;
    if (!node || !backdrop) return;
    const surface = backdrop;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    node.querySelector<HTMLElement>("input, textarea, button")?.focus();
    const media = window.matchMedia("(max-width: 760px)");
    let release = function releaseInert() {};

    function syncInert() {
      release();
      release = media.matches ? holdOutside(surface) : function releaseInert() {};
    }

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

    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      const dialog = dialogRef.current;
      if (!(target instanceof Node)) return;
      if (anchorRef.current?.contains(target)) return;
      if (dialog?.contains(target)) return;
      onCloseRef.current();
    }

    syncInert();
    media.addEventListener("change", syncInert);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      media.removeEventListener("change", syncInert);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
      release();
      previous?.focus();
    };
  }, [anchorRef, modal]);

  function onBackdrop(event: MouseEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    onClose();
  }

  return (
    <div className="note-notify-layer" onClick={onBackdrop} ref={backdropRef} role="presentation">
      <NoteNotifyPanel
        dialogRef={dialogRef}
        documentId={documentId}
        modal={modal}
        onClose={onClose}
      />
    </div>
  );
}
