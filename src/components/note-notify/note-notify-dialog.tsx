"use client";

import { useEffect, useState, type RefObject } from "react";
import { DocumentSharePortal } from "@/components/library/document-share-portal";
import { NoteNotifyLayer } from "@/components/note-notify/note-notify-layer";

interface Properties {
  anchorRef: RefObject<HTMLElement | null>;
  documentId: string;
  onClose: () => void;
}

export function NoteNotifyDialog(props: Properties) {
  const { anchorRef, documentId, onClose } = props;
  const [narrow, setNarrow] = useState(false);
  const [placed, setPlaced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const apply = () => {
      setNarrow(media.matches);
      setPlaced(true);
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  if (!placed) return null;

  if (narrow) {
    return (
      <DocumentSharePortal>
        <NoteNotifyLayer anchorRef={anchorRef} documentId={documentId} modal onClose={onClose} />
      </DocumentSharePortal>
    );
  }

  return (
    <NoteNotifyLayer
      anchorRef={anchorRef}
      documentId={documentId}
      modal={false}
      onClose={onClose}
    />
  );
}
