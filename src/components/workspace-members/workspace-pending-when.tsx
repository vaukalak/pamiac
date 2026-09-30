import { WorkspacePendingResend } from "@/components/workspace-members/workspace-pending-resend";
import { pendingSentLabel } from "@/lib/workspace-member-view";

interface Properties {
  createdAt: string;
  managing: boolean;
  pendingId: string;
  workspaceId: string;
}

export function WorkspacePendingWhen(props: Properties) {
  const { createdAt, managing, pendingId, workspaceId } = props;

  return (
    <td className="workspace-pending-when">
      <span>{pendingSentLabel(createdAt)}</span>
      {managing ? <WorkspacePendingResend pendingId={pendingId} workspaceId={workspaceId} /> : null}
    </td>
  );
}
