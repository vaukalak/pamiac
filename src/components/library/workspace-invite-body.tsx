"use client";

import { useQuery } from "@tanstack/react-query";
import { WorkspaceInviteChoice } from "@/components/library/workspace-invite-choice";
import { fetchWorkspaceInvite, workspaceInviteQueryKey } from "@/lib/library-workspace-invites";
import { Alert } from "@/ui/Alert";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  inviteId: string;
  onClose: () => void;
}

export function WorkspaceInviteBody(props: Properties) {
  const { inviteId, onClose } = props;
  const query = useQuery({
    queryKey: workspaceInviteQueryKey(inviteId),
    queryFn: () => fetchWorkspaceInvite(inviteId),
    retry: false,
  });
  const message = query.error instanceof Error ? query.error.message : "";
  const invite = query.data ?? null;

  return (
    <div>
      {query.isPending ? <Paragraph className="hint">Loading the invitation.</Paragraph> : null}
      {message ? <Alert>{message}</Alert> : null}
      {invite ? <WorkspaceInviteChoice invite={invite} onDone={onClose} /> : null}
    </div>
  );
}
