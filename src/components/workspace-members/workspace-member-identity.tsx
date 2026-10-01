import { WorkspaceMemberName } from "@/components/workspace-members/workspace-member-name";
import { memberInitials } from "@/lib/workspace-member-view";

interface Properties {
  name: string;
  you: boolean;
}

export function WorkspaceMemberIdentity(props: Properties) {
  const { name, you } = props;

  return (
    <div className="workspace-member-identity">
      <span aria-hidden="true" className="workspace-member-avatar">
        {memberInitials(name)}
      </span>
      <WorkspaceMemberName name={name} you={you} />
    </div>
  );
}
