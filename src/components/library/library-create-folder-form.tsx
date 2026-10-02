"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { folderName } from "@/lib/folder-library";
import { libraryFoldersQueryKey } from "@/lib/library-folders";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";
import { Form } from "@/ui/Form";

interface FolderValues {
  name: string;
}

interface Properties {
  onCreated: () => void;
  parentId: string | null;
  workspaceId: string;
}

export function LibraryCreateFolderForm(props: Properties) {
  const { onCreated, parentId, workspaceId } = props;
  const queryClient = useQueryClient();
  const form = useForm<FolderValues>({
    defaultValues: { name: "" },
  });
  const mutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, workspaceId, parentId }),
      }).catch(() => null);
      if (!response) throw new Error("Could not create the folder");
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(body?.error ?? "Could not create the folder");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: libraryFoldersQueryKey });
      form.reset({ name: "" });
      onCreated();
    },
  });
  const message = mutation.error instanceof Error ? mutation.error.message : "";

  function submit(values: FolderValues) {
    try {
      folderName(values.name);
    } catch (error) {
      const text = error instanceof Error ? error.message : "Name the folder";
      form.setError("name", { message: text });
      return;
    }
    mutation.mutate(values.name);
  }

  return (
    <Form.Context className="library-folder-form" form={form} onSubmit={submit}>
      <Form.Input label="Name" name="name" type="text" />
      <Button disabled={mutation.isPending} type="submit">
        {mutation.isPending ? "Creating…" : "Create folder"}
      </Button>
      {message ? <Alert>{message}</Alert> : null}
    </Form.Context>
  );
}
