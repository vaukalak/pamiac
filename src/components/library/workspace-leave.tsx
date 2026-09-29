"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { openWorkspaceName, PERSONAL_SPACE_ID, type NamedWorkspace } from "@/lib/library-spaces";
import {
  leaveWorkspace,
  workspacesQueryKey,
  workspacesQueryOptions,
} from "@/lib/library-workspaces";

interface Properties {
  workspaceId: string;
}

export function WorkspaceLeave(props: Properties) {
  const { workspaceId } = props;
  const queryClient = useQueryClient();
  const spaces = useQuery(workspacesQueryOptions());
  const label = openWorkspaceName(workspaceId, spaces.data) || "this workspace";
  const [confirming, setConfirming] = useState(false);
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
      {confirming ? <p>Leave {label}?</p> : null}
      <button
        className="btn danger small"
        disabled={mutation.isPending}
        onClick={() => {
          if (!confirming) {
            setConfirming(true);
            return;
          }
          mutation.mutate();
        }}
        type="button"
      >
        {mutation.isPending ? "Leaving…" : confirming ? `Leave ${label}` : "Leave workspace"}
      </button>
      {confirming ? (
        <button
          className="btn ghost small"
          disabled={mutation.isPending}
          onClick={() => setConfirming(false)}
          type="button"
        >
          Cancel
        </button>
      ) : null}
      {message ? <p className="error">{message}</p> : null}
    </div>
  );
}
