"use client";

import { useQuery } from "@tanstack/react-query";
import type { NoteNotifyDraft } from "@/components/note-notify/note-notify-draft";
import { NoteNotifyGlyph } from "@/components/note-notify/note-notify-glyph";
import { readNoteSubscription } from "@/components/note-notify/note-notify-read";
import { Button } from "@/ui/Button";

interface Properties {
  documentId: string;
  open: boolean;
  onToggle: () => void;
}

function bellCopy(mode: NoteNotifyDraft["mode"] | null) {
  if (mode === "any") return "Notifications: any change";
  if (mode === "criteria") return "Notifications: matching criteria";
  if (mode === "never") return "Notifications off";
  return "Notify";
}

export function NoteNotifyBell(props: Properties) {
  const { documentId, open, onToggle } = props;
  const subscription = useQuery({
    queryKey: ["note-notification", documentId],
    queryFn: () => readNoteSubscription(documentId),
  });
  const mode = subscription.isSuccess ? subscription.data.mode : null;
  const copy = bellCopy(mode);
  const active = mode === "any" || mode === "criteria";
  const className = active
    ? "secondary icon-button note-notify-bell is-on"
    : "secondary icon-button note-notify-bell";

  return (
    <Button className={className} expanded={open} onClick={onToggle} title={copy} type="button">
      <NoteNotifyGlyph active={active} />
      {mode === "criteria" ? <span aria-hidden="true" className="note-notify-dot" /> : null}
      <span className="visually-hidden">{copy}</span>
    </Button>
  );
}
