"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { libraryItemsQueryKey } from "@/lib/library-items";
import { importSharedNote } from "@/lib/note-import";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";

interface Properties {
  readMarkdown: () => string;
  title: string;
  workspaceId: string;
}

export function NoteImportButton(props: Properties) {
  const { readMarkdown, title, workspaceId } = props;
  const router = useRouter();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => importSharedNote(title, readMarkdown(), workspaceId),
    onSuccess: async (id) => {
      await queryClient.invalidateQueries({ queryKey: libraryItemsQueryKey });
      router.push(`/d/${id}`);
    },
  });
  const message = mutation.error instanceof Error ? mutation.error.message : "";
  const button = (
    <Button
      className="secondary small"
      disabled={mutation.isPending}
      onClick={() => {
        mutation.mutate();
      }}
      type="button"
    >
      {mutation.isPending ? "Importing…" : "Import"}
    </Button>
  );

  if (!message) return button;

  return (
    <div className="share-markdown-import">
      {button}
      <Alert>{message}</Alert>
    </div>
  );
}
