import { WorkspacePendingWhen } from "@/components/workspace-members/workspace-pending-when";
import type { WorkspaceRosterPending } from "@/lib/library-workspaces";

interface Properties {
  managing: boolean;
  pending: WorkspaceRosterPending;
  workspaceId: string;
}

export function WorkspacePendingRow(props: Properties) {
  const { managing, pending, workspaceId } = props;

  return (
    <tr>
      <td>{pending.email}</td>
      <td>Invited</td>
      <WorkspacePendingWhen
        createdAt={pending.createdAt}
        managing={managing}
        pendingId={pending.id}
        workspaceId={workspaceId}
      />
    </tr>
  );
}
