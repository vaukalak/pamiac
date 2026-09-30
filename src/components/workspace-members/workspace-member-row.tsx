import { WorkspaceMemberCell } from "@/components/workspace-members/workspace-member-cell";
import { WorkspaceMemberRoleCell } from "@/components/workspace-members/workspace-member-role-cell";
import type { WorkspaceRosterMember } from "@/lib/library-workspaces";
import { memberJoinedLabel, sameMemberEmail } from "@/lib/workspace-member-view";

interface Properties {
  email: string;
  managing: boolean;
  member: WorkspaceRosterMember;
  workspaceId: string;
}

export function WorkspaceMemberRow(props: Properties) {
  const { email, managing, member, workspaceId } = props;
  const you = sameMemberEmail(member.email, email);

  return (
    <tr>
      <WorkspaceMemberCell name={member.name} you={you} />
      <WorkspaceMemberRoleCell
        editable={managing && !you}
        memberId={member.id}
        role={member.role}
        workspaceId={workspaceId}
      />
      <td>{memberJoinedLabel(member.createdAt)}</td>
    </tr>
  );
}
