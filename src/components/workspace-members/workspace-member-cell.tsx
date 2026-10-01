import { WorkspaceMemberIdentity } from "@/components/workspace-members/workspace-member-identity";

interface Properties {
  name: string;
  you: boolean;
}

export function WorkspaceMemberCell(props: Properties) {
  const { name, you } = props;

  return (
    <td>
      <WorkspaceMemberIdentity name={name} you={you} />
    </td>
  );
}
