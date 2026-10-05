"use client";

import type { RefObject } from "react";
import { NoteNotifyBody } from "@/components/note-notify/note-notify-body";
import { NoteNotifyHeading } from "@/components/note-notify/note-notify-heading";
import { NoteNotifyHint } from "@/components/note-notify/note-notify-hint";

interface Properties {
  dialogRef: RefObject<HTMLDivElement | null>;
  documentId: string;
  modal: boolean;
  onClose: () => void;
}

export function NoteNotifyPanel(props: Properties) {
  const { dialogRef, documentId, modal, onClose } = props;

  return (
    <div
      aria-describedby="note-notify-hint"
      aria-labelledby="note-notify-title"
      aria-modal={modal}
      className="share-dialog share-access-dialog note-notify-panel"
      onClick={(event) => event.stopPropagation()}
      ref={dialogRef}
      role="dialog"
      tabIndex={-1}
    >
      <NoteNotifyHeading />
      <NoteNotifyHint />
      <NoteNotifyBody documentId={documentId} onClose={onClose} />
    </div>
  );
}
