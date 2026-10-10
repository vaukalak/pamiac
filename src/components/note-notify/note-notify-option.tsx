"use client";

import { NoteNotifyChoice } from "@/components/note-notify/note-notify-choice";
import { NoteNotifyCriteria } from "@/components/note-notify/note-notify-criteria";
import type { NoteNotifyMode } from "@/components/note-notify/note-notify-draft";

interface Properties {
  checked: boolean;
  detail: string;
  title: string;
  value: NoteNotifyMode;
}

export function NoteNotifyOption(props: Properties) {
  const { checked, detail, title, value } = props;
  const showCriteria = value === "criteria" && checked;

  return (
    <div className="note-notify-option">
      <NoteNotifyChoice checked={checked} detail={detail} title={title} value={value} />
      {showCriteria ? <NoteNotifyCriteria /> : null}
    </div>
  );
}
