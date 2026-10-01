import { WorkspaceMemberBody } from "@/components/workspace-members/workspace-member-body";
import { WorkspaceMemberColumns } from "@/components/workspace-members/workspace-member-columns";
import type { WorkspaceRosterMember } from "@/lib/library-workspaces";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  email: string;
  managing: boolean;
  members: WorkspaceRosterMember[];
  workspaceId: string;
}

export function WorkspaceMemberTable(props: Properties) {
  const { email, managing, members, workspaceId } = props;

  if (members.length === 0) {
    return <Paragraph>No members match this search.</Paragraph>;
  }

  return (
    <table className="workspace-members-table">
      <WorkspaceMemberColumns when="Joined" />
      <WorkspaceMemberBody
        email={email}
        managing={managing}
        members={members}
        workspaceId={workspaceId}
      />
    </table>
  );
}
