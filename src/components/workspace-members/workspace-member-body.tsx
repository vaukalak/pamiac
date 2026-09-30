import { WorkspaceMemberRow } from "@/components/workspace-members/workspace-member-row";
import type { WorkspaceRosterMember } from "@/lib/library-workspaces";

interface Properties {
  email: string;
  managing: boolean;
  members: WorkspaceRosterMember[];
  workspaceId: string;
}

export function WorkspaceMemberBody(props: Properties) {
  const { email, managing, members, workspaceId } = props;

  return (
    <tbody>
      {members.map((member) => (
        <WorkspaceMemberRow
          key={member.id}
          email={email}
          managing={managing}
          member={member}
          workspaceId={workspaceId}
        />
      ))}
    </tbody>
  );
}
