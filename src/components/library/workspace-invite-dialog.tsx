"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { WorkspaceInvitePanel } from "@/components/library/workspace-invite-panel";

interface Properties {
  inviteId: string;
}

export function WorkspaceInviteDialog(props: Properties) {
  const { inviteId } = props;
  const router = useRouter();
  const [mount, setMount] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const shell = document.querySelector(".library-shell");
    setMount(shell instanceof HTMLElement ? shell : document.body);
  }, []);

  function close() {
    router.replace("/workspace");
  }

  if (!mount) return null;

  return createPortal(
    <div className="share-backdrop" onClick={close} role="presentation">
      <WorkspaceInvitePanel inviteId={inviteId} onClose={close} />
    </div>,
    mount,
  );
}
