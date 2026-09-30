"use client";

import { useMutation } from "@tanstack/react-query";
import { resendWorkspacePending } from "@/lib/library-workspaces";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";

interface Properties {
  pendingId: string;
  workspaceId: string;
}

export function WorkspacePendingResend(props: Properties) {
  const { pendingId, workspaceId } = props;
  const mutation = useMutation({
    mutationFn: () => resendWorkspacePending(workspaceId, pendingId),
  });
  const message = mutation.error instanceof Error ? mutation.error.message : "";

  return (
    <>
      <Button disabled={mutation.isPending} onClick={() => mutation.mutate()} type="button">
        {mutation.isPending ? "Sending…" : "Resend"}
      </Button>
      {message ? <Alert>{message}</Alert> : null}
    </>
  );
}
