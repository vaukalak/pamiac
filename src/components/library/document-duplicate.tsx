"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { duplicateNoteTitle } from "@/lib/note-file";
import { libraryItemsQueryKey } from "@/lib/library-items";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";

interface Properties {
  content: string;
  onDone: () => void;
  title: string;
  workspaceId: string | null;
}

async function readError(response: Response) {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? "Could not duplicate this note.";
}

async function duplicateNote(title: string, content: string, workspaceId: string | null) {
  const payload: { type: "note"; title: string; workspaceId?: string } = {
    type: "note",
    title: duplicateNoteTitle(title),
  };
  if (workspaceId) payload.workspaceId = workspaceId;
  const created = await fetch("/api/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => null);
  if (!created) throw new Error("Could not duplicate this note.");
  const createdBody = (await created.json().catch(() => null)) as {
    id?: string;
    error?: string;
  } | null;
  if (!created.ok || !createdBody?.id) {
    throw new Error(createdBody?.error ?? "Could not duplicate this note.");
  }
  const saved = await fetch(`/api/documents/${createdBody.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, version: 1 }),
  }).catch(() => null);
  if (!saved || !saved.ok) {
    await fetch(`/api/documents/${createdBody.id}`, { method: "DELETE" }).catch(() => null);
    throw new Error(saved ? await readError(saved) : "Could not duplicate this note.");
  }
  return createdBody.id;
}

export function DocumentDuplicate(props: Properties) {
  const { content, onDone, title, workspaceId } = props;
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => duplicateNote(title, content, workspaceId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: libraryItemsQueryKey });
      onDone();
    },
  });
  const message = mutation.error instanceof Error ? mutation.error.message : "";

  return (
    <div className="menu-duplicate">
      <Button
        className="menu-item"
        disabled={mutation.isPending}
        onClick={() => {
          mutation.mutate();
        }}
        type="button"
      >
        {mutation.isPending ? "Duplicating…" : "Duplicate"}
      </Button>
      {message ? <Alert>{message}</Alert> : null}
    </div>
  );
}
