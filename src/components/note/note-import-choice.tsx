"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { type FormEvent } from "react";
import { useForm } from "react-hook-form";
import { libraryItemsQueryKey } from "@/lib/library-items";
import type { LibrarySpace } from "@/lib/library-spaces";
import { importSharedNote } from "@/lib/note-import";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";
import { Form } from "@/ui/Form";

interface Properties {
  readMarkdown: () => string;
  spaces: readonly LibrarySpace[];
  title: string;
}

interface ImportValues {
  workspaceId: string;
}

export function NoteImportChoice(props: Properties) {
  const { readMarkdown, spaces, title } = props;
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<ImportValues>({
    defaultValues: { workspaceId: spaces[0]?.id ?? "" },
  });
  const mutation = useMutation({
    mutationFn: (workspaceId: string) => importSharedNote(title, readMarkdown(), workspaceId),
    onSuccess: async (id) => {
      await queryClient.invalidateQueries({ queryKey: libraryItemsQueryKey });
      router.push(`/d/${id}`);
    },
  });
  const message = mutation.error instanceof Error ? mutation.error.message : "";
  const options = spaces.map((space) => ({ value: space.id, label: space.label }));

  function submit(values: ImportValues) {
    mutation.mutate(values.workspaceId);
  }

  function keepShareForm(event: FormEvent<HTMLDivElement>) {
    event.stopPropagation();
  }

  return (
    <div className="share-markdown-import" onSubmit={keepShareForm}>
      <Form.Context className="share-markdown-import" form={form} onSubmit={submit}>
        <Form.Select label="Workspace" name="workspaceId" options={options} />
        <Button className="secondary small" disabled={mutation.isPending} type="submit">
          {mutation.isPending ? "Importing…" : "Import"}
        </Button>
        {message ? <Alert>{message}</Alert> : null}
      </Form.Context>
    </div>
  );
}
