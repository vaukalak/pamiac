"use client";

import { useQuery } from "@tanstack/react-query";
import { readNoteSubscription } from "@/components/note-notify/note-notify-read";
import { NoteNotifySave } from "@/components/note-notify/note-notify-save";
import { Alert } from "@/ui/Alert";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  documentId: string;
  onClose: () => void;
}

export function NoteNotifyBody(props: Properties) {
  const { documentId, onClose } = props;
  const subscription = useQuery({
    queryKey: ["note-notification", documentId],
    queryFn: () => readNoteSubscription(documentId),
  });

  if (subscription.isPending) return <Paragraph>Loading notification settings.</Paragraph>;
  if (subscription.isError) {
    const message =
      subscription.error instanceof Error
        ? subscription.error.message
        : "Could not load notification settings";
    return <Alert>{message}</Alert>;
  }
  return <NoteNotifySave documentId={documentId} initial={subscription.data} onClose={onClose} />;
}
