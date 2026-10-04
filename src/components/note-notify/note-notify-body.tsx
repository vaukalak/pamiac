"use client";

import { useQuery } from "@tanstack/react-query";
import type { NoteNotifyDraft } from "@/components/note-notify/note-notify-draft";
import { NoteNotifySave } from "@/components/note-notify/note-notify-save";
import { Alert } from "@/ui/Alert";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  documentId: string;
}

async function readSubscription(documentId: string): Promise<NoteNotifyDraft> {
  const response = await fetch(`/api/documents/${documentId}/notification`);
  const body = (await response.json().catch(() => null)) as
    (NoteNotifyDraft & { error?: string }) | null;
  if (!response.ok || !body || !body.mode) {
    throw new Error(body?.error ?? "Could not load notification settings");
  }
  return { mode: body.mode, criteria: body.criteria ?? "" };
}

export function NoteNotifyBody(props: Properties) {
  const { documentId } = props;
  const subscription = useQuery({
    queryKey: ["note-notification", documentId],
    queryFn: () => readSubscription(documentId),
  });

  if (subscription.isPending) return <Paragraph>Loading notification settings.</Paragraph>;
  if (subscription.isError) {
    const message =
      subscription.error instanceof Error
        ? subscription.error.message
        : "Could not load notification settings";
    return <Alert>{message}</Alert>;
  }
  return <NoteNotifySave documentId={documentId} initial={subscription.data} />;
}
