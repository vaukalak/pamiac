"use client";

import { useFormContext } from "react-hook-form";
import type { NoteNotifyDraft } from "@/components/note-notify/note-notify-draft";
import { Form } from "@/ui/Form";

export function NoteNotifyCriteria() {
  const { watch } = useFormContext<NoteNotifyDraft>();
  const mode = watch("mode");
  if (mode !== "criteria") return null;

  return (
    <Form.Textarea
      label="When to send the notification"
      name="criteria"
      placeholder="Describe the changes that should email you"
      rows={4}
    />
  );
}
