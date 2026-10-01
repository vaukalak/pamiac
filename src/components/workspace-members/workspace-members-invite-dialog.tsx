import type { ReactNode } from "react";
import { WorkspaceMembersInvitePanel } from "@/components/workspace-members/workspace-members-invite-panel";

interface Properties {
  children: ReactNode;
  onClose: () => void;
}

export function WorkspaceMembersInviteDialog(props: Properties) {
  const { children, onClose } = props;

  return (
    <div
      className="share-backdrop workspace-invite-backdrop"
      onPointerDown={onClose}
      role="presentation"
    >
      <WorkspaceMembersInvitePanel onClose={onClose}>{children}</WorkspaceMembersInvitePanel>
    </div>
  );
}
