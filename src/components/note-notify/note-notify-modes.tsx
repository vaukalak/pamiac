"use client";

import { useFormContext } from "react-hook-form";
import {
  NOTE_NOTIFY_CHOICES,
  type NoteNotifyDraft,
} from "@/components/note-notify/note-notify-draft";
import { NoteNotifyOption } from "@/components/note-notify/note-notify-option";

interface Properties {
  documentId: string;
}

export function NoteNotifyModes(props: Properties) {
  const { documentId } = props;
  const { watch } = useFormContext<NoteNotifyDraft>();
  const mode = watch("mode");

  return (
    <fieldset className="share-modes">
      <legend className="visually-hidden">When</legend>
      {NOTE_NOTIFY_CHOICES.map((item) => (
        <NoteNotifyOption
          checked={mode === item.value}
          detail={item.detail}
          documentId={documentId}
          key={item.value}
          title={item.title}
          value={item.value}
        />
      ))}
    </fieldset>
  );
}
