import { WorkspaceMemberRole } from "@/components/workspace-members/workspace-member-role";
import { WorkspaceMemberRoleText } from "@/components/workspace-members/workspace-member-role-text";
import type { WorkspaceRole } from "@/lib/library-spaces";

interface Properties {
  editable: boolean;
  memberId: string;
  role: WorkspaceRole;
  workspaceId: string;
}

export function WorkspaceMemberRoleCell(props: Properties) {
  const { editable, memberId, role, workspaceId } = props;

  return (
    <td>
      {editable ? (
        <WorkspaceMemberRole
          key={`${memberId}:${role}`}
          memberId={memberId}
          role={role}
          workspaceId={workspaceId}
        />
      ) : (
        <WorkspaceMemberRoleText role={role} />
      )}
    </td>
  );
}
