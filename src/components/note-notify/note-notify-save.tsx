"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  NOTE_NOTIFY_MODES,
  type NoteNotifyDraft,
} from "@/components/note-notify/note-notify-draft";
import { NoteNotifyCriteria } from "@/components/note-notify/note-notify-criteria";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";
import { Form } from "@/ui/Form";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  documentId: string;
  initial: NoteNotifyDraft;
}

async function saveSubscription(documentId: string, values: NoteNotifyDraft) {
  const response = await fetch(`/api/documents/${documentId}/notification`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: values.mode,
      criteria: values.mode === "criteria" ? values.criteria : "",
    }),
  }).catch(() => null);
  const body = (response ? await response.json().catch(() => null) : null) as
    (NoteNotifyDraft & { error?: string }) | null;
  if (!response || !body || !response.ok || !body.mode) {
    throw new Error(body?.error ?? "Could not save notification settings");
  }
  return { mode: body.mode, criteria: body.criteria ?? "" };
}

export function NoteNotifySave(props: Properties) {
  const { documentId, initial } = props;
  const queryClient = useQueryClient();
  const form = useForm<NoteNotifyDraft>({
    defaultValues: { mode: initial.mode, criteria: initial.criteria },
  });
  const save = useMutation({
    mutationFn: (values: NoteNotifyDraft) => saveSubscription(documentId, values),
    onSuccess: (saved) => {
      queryClient.setQueryData(["note-notification", documentId], saved);
      form.reset(saved);
    },
  });

  function submit(values: NoteNotifyDraft) {
    if (save.isPending) return;
    if (values.mode === "criteria" && !values.criteria.trim()) {
      form.setError("criteria", { message: "Describe when to send the notification" });
      return;
    }
    save.mutate(values);
  }

  const error = save.error instanceof Error ? save.error.message : "";

  return (
    <Form.Context form={form} onSubmit={submit}>
      <Paragraph>Choose when this note should email you.</Paragraph>
      <Form.Select label="When" name="mode" options={NOTE_NOTIFY_MODES} />
      <NoteNotifyCriteria />
      <Button className="library-lime" disabled={save.isPending} type="submit">
        {save.isPending ? "Saving…" : "Save"}
      </Button>
      {save.isSuccess ? <Paragraph className="hint">Notification saved.</Paragraph> : null}
      {error ? <Alert>{error}</Alert> : null}
    </Form.Context>
  );
}
