import { WorkspacePendingTable } from "@/components/workspace-members/workspace-pending-table";
import { WorkspacePendingTitle } from "@/components/workspace-members/workspace-pending-title";
import type { WorkspaceRosterPending } from "@/lib/library-workspaces";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  managing: boolean;
  pending: WorkspaceRosterPending[];
  workspaceId: string;
}

export function WorkspacePendingSection(props: Properties) {
  const { managing, pending, workspaceId } = props;

  return (
    <section className="workspace-pending">
      <WorkspacePendingTitle count={pending.length} />
      {pending.length === 0 ? (
        <Paragraph>No pending invitations.</Paragraph>
      ) : (
        <WorkspacePendingTable managing={managing} pending={pending} workspaceId={workspaceId} />
      )}
    </section>
  );
}
