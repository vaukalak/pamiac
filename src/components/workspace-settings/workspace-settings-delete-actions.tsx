"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BoardDocument } from "@/components/library/board-document";
import { useLibraryShell } from "@/components/library/library-shell";
import { libraryItemsQueryKey } from "@/lib/library-items";
import { openWorkspaceName, PERSONAL_SPACE_ID, type NamedWorkspace } from "@/lib/library-spaces";
import {
  deleteWorkspace,
  workspacesQueryKey,
  workspacesQueryOptions,
} from "@/lib/library-workspaces";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";
import { Paragraph } from "@/ui/Paragraph";

export function WorkspaceSettingsDeleteActions() {
  const shell = useLibraryShell();
  const { workspaceId, workspaces } = shell;
  const router = useRouter();
  const queryClient = useQueryClient();
  const spaces = useQuery({
    ...workspacesQueryOptions(),
    initialData: workspaces,
  });
  const label = openWorkspaceName(workspaceId, spaces.data) || "this workspace";
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
      window.localStorage.setItem("pamiac-open-library", PERSONAL_SPACE_ID);
      router.push("/workspace");
    },
  });

  if (workspaceId === PERSONAL_SPACE_ID) return null;

  const message = mutation.error instanceof Error ? mutation.error.message : "";

  return (
    <div className="workspace-danger-actions">
      {confirming ? <Paragraph>Delete {label} and its documents?</Paragraph> : null}
      <Button
        className="danger"
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
        {mutation.isPending ? "Deleting…" : confirming ? `Delete ${label}` : "Delete workspace"}
      </Button>
      {confirming ? (
        <Button
          className="ghost"
          disabled={mutation.isPending}
          onClick={() => setConfirming(false)}
          type="button"
        >
          Cancel
        </Button>
      ) : null}
      {message ? <Alert>{message}</Alert> : null}
    </div>
  );
}
