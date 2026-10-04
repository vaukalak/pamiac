"use client";

import { useFormContext } from "react-hook-form";
import type { NoteNotifyDraft, NoteNotifyMode } from "@/components/note-notify/note-notify-draft";
import { ShareModeCopy } from "@/components/share/share-mode-copy";

interface Properties {
  checked: boolean;
  detail: string;
  title: string;
  value: NoteNotifyMode;
}

export function NoteNotifyChoice(props: Properties) {
  const { checked, detail, title, value } = props;
  const { register } = useFormContext<NoteNotifyDraft>();

  return (
    <label className={checked ? "choice is-selected" : "choice"}>
      <ShareModeCopy detail={detail} title={title} />
      <input {...register("mode")} checked={checked} type="radio" value={value} />
    </label>
  );
}
