"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PERSONAL_SPACE_ID, type NamedWorkspace } from "@/lib/library-spaces";
import { leaveWorkspace, workspacesQueryKey } from "@/lib/library-workspaces";

interface Properties {
  workspaceId: string;
}

export function WorkspaceLeave(props: Properties) {
  const { workspaceId } = props;
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => leaveWorkspace(workspaceId),
    onSuccess: () => {
      queryClient.setQueryData<NamedWorkspace[]>(workspacesQueryKey, (current) =>
        current?.filter((workspace) => workspace.id !== workspaceId),
      );
    },
  });

  if (workspaceId === PERSONAL_SPACE_ID) return null;

  const message = mutation.error instanceof Error ? mutation.error.message : "";

  return (
    <div className="workspace-leave">
      <button
        className="btn danger small"
        disabled={mutation.isPending}
        onClick={() => {
          mutation.mutate();
        }}
        type="button"
      >
        {mutation.isPending ? "Leaving…" : "Leave workspace"}
      </button>
      {message ? <p className="error">{message}</p> : null}
    </div>
  );
}
