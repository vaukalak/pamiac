import { WorkspaceInviteActions } from "@/components/library/workspace-invite-actions";
import type { WorkspaceInviteDetails } from "@/lib/library-workspace-invites";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  invite: WorkspaceInviteDetails;
  onDone: () => void;
}

export function WorkspaceInviteChoice(props: Properties) {
  const { invite, onDone } = props;

  return (
    <div className="share-actions">
      <Paragraph className="workspace-invite-name">{invite.workspaceName}</Paragraph>
      <Paragraph className="hint">Join this workspace, or decline.</Paragraph>
      <WorkspaceInviteActions inviteId={invite.id} onDone={onDone} />
    </div>
  );
}
