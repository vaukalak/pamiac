"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { acceptWorkspaceInvite, rejectWorkspaceInvite } from "@/lib/library-workspace-invites";
import { workspacesQueryKey } from "@/lib/library-workspaces";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";

interface Properties {
  inviteId: string;
  onDone: () => void;
}

export function WorkspaceInviteActions(props: Properties) {
  const { inviteId, onDone } = props;
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (decision: "accept" | "reject") =>
      decision === "accept" ? acceptWorkspaceInvite(inviteId) : rejectWorkspaceInvite(inviteId),
    onSuccess: (_result, decision) => {
      if (decision === "accept") {
        void queryClient.invalidateQueries({ queryKey: workspacesQueryKey });
      }
      onDone();
    },
  });
  const message = mutation.error instanceof Error ? mutation.error.message : "";
  const pending = mutation.isPending ? mutation.variables : null;

  useEffect(() => {
    document.getElementById("workspace-invite-accept")?.focus();
  }, []);

  return (
    <div className="row-actions">
      <Button
        className="library-lime"
        disabled={mutation.isPending}
        id="workspace-invite-accept"
        onClick={() => mutation.mutate("accept")}
        type="button"
      >
        {pending === "accept" ? "Accepting…" : "Accept"}
      </Button>
      <Button
        className="secondary"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate("reject")}
        type="button"
      >
        {pending === "reject" ? "Rejecting…" : "Reject"}
      </Button>
      {message ? <Alert>{message}</Alert> : null}
    </div>
  );
}
