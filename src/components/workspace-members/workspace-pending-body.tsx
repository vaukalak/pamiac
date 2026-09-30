import { WorkspacePendingRow } from "@/components/workspace-members/workspace-pending-row";
import type { WorkspaceRosterPending } from "@/lib/library-workspaces";

interface Properties {
  managing: boolean;
  pending: WorkspaceRosterPending[];
  workspaceId: string;
}

export function WorkspacePendingBody(props: Properties) {
  const { managing, pending, workspaceId } = props;

  return (
    <tbody>
      {pending.map((row) => (
        <WorkspacePendingRow
          key={row.id}
          managing={managing}
          pending={row}
          workspaceId={workspaceId}
        />
      ))}
    </tbody>
  );
}
