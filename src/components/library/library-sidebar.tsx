"use client";

import { useState } from "react";
import { LibrarySpaceAddButton } from "@/components/library/library-space-add-button";
import { LibrarySpaceAddDialog } from "@/components/library/library-space-add-dialog";
import { WorkspaceCreate } from "@/components/library/workspace-create";
import { WorkspaceSelector } from "@/components/library/workspace-selector";
import type { NamedWorkspace } from "@/lib/library-spaces";

interface Properties {
  onSelect: (workspaceId: string) => void;
  selectedId: string;
  workspaces: NamedWorkspace[];
}

export function LibrarySidebar(props: Properties) {
  const { onSelect: selectWorkspace, selectedId, workspaces } = props;
  const [creating, setCreating] = useState(false);

  function close() {
    setCreating(false);
  }

  function onSelect(workspaceId: string) {
    close();
    selectWorkspace(workspaceId);
  }

  function open() {
    setCreating(true);
  }

  const workspaceForm = <WorkspaceCreate onCreated={onSelect} />;

  return (
    <aside className="library-sidebar">
      <WorkspaceSelector
        initialWorkspaces={workspaces}
        onSelect={selectWorkspace}
        selectedId={selectedId}
      />
      <LibrarySpaceAddButton expanded={creating} label="Add workspace" onOpen={open} />
      {creating ? <LibrarySpaceAddDialog form={workspaceForm} onClose={close} /> : null}
    </aside>
  );
}
