"use client";

import { LibraryCreate } from "@/components/library/library-create";
import { WorkspaceSelector } from "@/components/library/workspace-selector";
import type { NamedWorkspace } from "@/lib/library-spaces";

interface Properties {
  onSelect: (workspaceId: string) => void;
  selectedId: string;
  workspaces: NamedWorkspace[];
}

export function LibraryHeader(props: Properties) {
  const { onSelect, selectedId, workspaces } = props;

  return (
    <div className="workspace-head">
      <WorkspaceSelector
        initialWorkspaces={workspaces}
        onSelect={onSelect}
        selectedId={selectedId}
      />
      <h1>Library</h1>
      <LibraryCreate workspaceId={selectedId} />
    </div>
  );
}
