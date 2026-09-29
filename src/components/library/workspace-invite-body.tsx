"use client";

import { useQuery } from "@tanstack/react-query";
import { WorkspaceInviteChoice } from "@/components/library/workspace-invite-choice";
import { fetchWorkspaceInvite, workspaceInviteQueryKey } from "@/lib/library-workspace-invites";

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
      {query.isPending ? <p className="hint">Loading the invitation.</p> : null}
      {message ? <p className="error">{message}</p> : null}
      {invite ? <WorkspaceInviteChoice invite={invite} onDone={onClose} /> : null}
    </div>
  );
}
