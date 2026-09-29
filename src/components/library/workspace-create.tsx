"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createWorkspace, workspacesQueryKey } from "@/lib/library-workspaces";
import type { NamedWorkspace } from "@/lib/library-spaces";

interface Properties {
  onCreated: (workspaceId: string) => void;
}

export function WorkspaceCreate(props: Properties) {
  const { onCreated } = props;
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createWorkspace,
    onSuccess: (workspace: NamedWorkspace) => {
      queryClient.setQueryData<NamedWorkspace[]>(workspacesQueryKey, (current) => {
        const list = current ?? [];
        if (list.some((item) => item.id === workspace.id)) return list;
        return [...list, workspace];
      });
      onCreated(workspace.id);
    },
  });

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const name = String(new FormData(form).get("name") ?? "");
    mutation.mutate(name, {
      onSuccess: () => {
        form.reset();
      },
    });
  }

  const message = mutation.error instanceof Error ? mutation.error.message : "";

  return (
    <form className="workspace-create" onSubmit={submit}>
      <label htmlFor="workspace-name">Workspace name</label>
      <input
        autoComplete="off"
        id="workspace-name"
        maxLength={80}
        name="name"
        required
        type="text"
      />
      <button className="btn secondary" disabled={mutation.isPending} type="submit">
        {mutation.isPending ? "Creating…" : "Create workspace"}
      </button>
      {message ? <p className="error">{message}</p> : null}
    </form>
  );
}
