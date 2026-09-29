"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { BoardDocument } from "@/components/library/board-document";
import { PERSONAL_SPACE_ID, type NamedWorkspace } from "@/lib/library-spaces";
import { libraryItemsQueryKey } from "@/lib/library-items";
import { deleteWorkspace, workspacesQueryKey } from "@/lib/library-workspaces";

interface Properties {
  workspaceId: string;
}

export function WorkspaceDelete(props: Properties) {
  const { workspaceId } = props;
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const mutation = useMutation({
    mutationFn: () => deleteWorkspace(workspaceId),
    onSuccess: () => {
      queryClient.setQueryData<NamedWorkspace[]>(workspacesQueryKey, (current) =>
        current?.filter((workspace) => workspace.id !== workspaceId),
      );
      queryClient.setQueryData<BoardDocument[]>(libraryItemsQueryKey, (current) =>
        current?.filter((document) => document.workspaceId !== workspaceId),
      );
    },
  });

  if (workspaceId === PERSONAL_SPACE_ID) return null;

  const message = mutation.error instanceof Error ? mutation.error.message : "";

  return (
    <div className="workspace-delete">
      {confirming ? <p>Delete this workspace and its documents?</p> : null}
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
        {mutation.isPending ? "Deleting…" : "Delete workspace"}
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
