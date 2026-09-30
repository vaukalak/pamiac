"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useLibraryShell } from "@/components/library/library-shell";
import { openWorkspaceName, workspaceName, type NamedWorkspace } from "@/lib/library-spaces";
import {
  renameWorkspace,
  workspacesQueryKey,
  workspacesQueryOptions,
} from "@/lib/library-workspaces";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";
import { Form } from "@/ui/Form";
import { Paragraph } from "@/ui/Paragraph";

interface NameValues {
  name: string;
}

export function WorkspaceSettingsNameForm() {
  const shell = useLibraryShell();
  const { workspaceId, workspaces } = shell;
  const spaces = useQuery({
    ...workspacesQueryOptions(),
    initialData: workspaces,
  });
  const name = openWorkspaceName(workspaceId, spaces.data);
  const form = useForm<NameValues>({
    defaultValues: { name },
  });
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (next: string) => renameWorkspace(workspaceId, next),
    onSuccess: (workspace) => {
      queryClient.setQueryData<NamedWorkspace[]>(workspacesQueryKey, (current) =>
        current?.map((item) =>
          item.id === workspace.id ? { ...item, name: workspace.name } : item,
        ),
      );
      void queryClient.invalidateQueries({ queryKey: workspacesQueryKey });
    },
  });

  function submit(values: NameValues) {
    try {
      mutation.mutate(workspaceName(values.name));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Name the workspace";
      form.setError("name", { message });
    }
  }

  const message = mutation.error instanceof Error ? mutation.error.message : "";

  return (
    <Form.Context className="workspace-name-form" form={form} onSubmit={submit}>
      <Form.Input label="Workspace name" name="name" type="text" />
      <Paragraph className="hint">Shown to everyone in this workspace.</Paragraph>
      <Button className="library-lime" disabled={mutation.isPending} type="submit">
        {mutation.isPending ? "Saving…" : "Save changes"}
      </Button>
      {message ? <Alert>{message}</Alert> : null}
    </Form.Context>
  );
}
