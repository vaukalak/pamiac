"use client";

import { useRouter } from "next/navigation";
import { WorkspaceInvitePanel } from "@/components/library/workspace-invite-panel";

interface Properties {
  inviteId: string;
}

export function WorkspaceInviteDialog(props: Properties) {
  const { inviteId } = props;
  const router = useRouter();

  function close() {
    router.replace("/workspace");
  }

  return (
    <div className="share-backdrop" onClick={close} role="presentation">
      <WorkspaceInvitePanel inviteId={inviteId} onClose={close} />
    </div>
  );
}
