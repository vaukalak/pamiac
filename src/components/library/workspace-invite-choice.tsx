import { WorkspaceInviteActions } from "@/components/library/workspace-invite-actions";
import type { WorkspaceInviteDetails } from "@/lib/library-workspace-invites";

interface Properties {
  invite: WorkspaceInviteDetails;
  onDone: () => void;
}

export function WorkspaceInviteChoice(props: Properties) {
  const { invite, onDone } = props;

  return (
    <div className="share-actions">
      <p className="workspace-invite-name">{invite.workspaceName}</p>
      <p className="hint">Join this workspace, or decline.</p>
      <WorkspaceInviteActions inviteId={invite.id} onDone={onDone} />
    </div>
  );
}
