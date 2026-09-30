import { WorkspaceMemberColumns } from "@/components/workspace-members/workspace-member-columns";
import { WorkspacePendingBody } from "@/components/workspace-members/workspace-pending-body";
import type { WorkspaceRosterPending } from "@/lib/library-workspaces";

interface Properties {
  managing: boolean;
  pending: WorkspaceRosterPending[];
  workspaceId: string;
}

export function WorkspacePendingTable(props: Properties) {
  const { managing, pending, workspaceId } = props;

  return (
    <table className="workspace-members-table">
      <WorkspaceMemberColumns when="Invited" />
      <WorkspacePendingBody managing={managing} pending={pending} workspaceId={workspaceId} />
    </table>
  );
}
