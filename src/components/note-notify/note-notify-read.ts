import type { NoteNotifyDraft } from "@/components/note-notify/note-notify-draft";

export async function readNoteSubscription(documentId: string): Promise<NoteNotifyDraft> {
  const response = await fetch(`/api/documents/${documentId}/notification`);
  const body = (await response.json().catch(() => null)) as
    (NoteNotifyDraft & { error?: string }) | null;
  if (!response.ok || !body || !body.mode) {
    throw new Error(body?.error ?? "Could not load notification settings");
  }
  return { mode: body.mode, criteria: body.criteria ?? "" };
}
