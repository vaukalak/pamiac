import { memberRoleLabel } from "@/lib/workspace-member-view";

interface Properties {
  role: string;
}

export function WorkspaceMemberRoleText(props: Properties) {
  const { role } = props;

  return <span>{memberRoleLabel(role)}</span>;
}
