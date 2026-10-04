"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { NoteNotifyActions } from "@/components/note-notify/note-notify-actions";
import type { NoteNotifyDraft } from "@/components/note-notify/note-notify-draft";
import { NoteNotifyModes } from "@/components/note-notify/note-notify-modes";
import { Alert } from "@/ui/Alert";
import { Form } from "@/ui/Form";

interface Properties {
  documentId: string;
  initial: NoteNotifyDraft;
  onClose: () => void;
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
  const { documentId, initial, onClose } = props;
  const queryClient = useQueryClient();
  const form = useForm<NoteNotifyDraft>({
    defaultValues: { mode: initial.mode, criteria: initial.criteria },
  });
  const save = useMutation({
    mutationFn: (values: NoteNotifyDraft) => saveSubscription(documentId, values),
    onSuccess: (saved) => {
      queryClient.setQueryData(["note-notification", documentId], saved);
      form.reset(saved);
      onClose();
    },
  });

  function submit(values: NoteNotifyDraft) {
    if (save.isPending) return;
    if (values.mode === "criteria" && !values.criteria.trim()) {
      form.setError("criteria", { message: "Describe the condition" });
      return;
    }
    save.mutate(values);
  }

  const error = save.error instanceof Error ? save.error.message : "";

  return (
    <Form.Context className="share-access-form" form={form} onSubmit={submit}>
      <NoteNotifyModes documentId={documentId} />
      <NoteNotifyActions pending={save.isPending} onCancel={onClose} />
      {error ? <Alert>{error}</Alert> : null}
    </Form.Context>
  );
}
