"use client";

import { useQuery } from "@tanstack/react-query";
import { adminWorkspaces } from "@/lib/share-workspace";
import { ShareWorkspaceOption } from "@/components/share/share-workspace-option";
import { workspacesQueryOptions } from "@/lib/library-workspaces";

interface Properties {
  selectedId: string | null;
  onSelect: (workspaceId: string | null) => void;
}

export function ShareWorkspaceChoice(props: Properties) {
  const { selectedId, onSelect } = props;
  const spaces = useQuery(workspacesQueryOptions());
  const workspaces = adminWorkspaces(spaces.data ?? []);
  if (workspaces.length === 0) return null;

  return (
    <fieldset className="share-modes">
      <legend className="hint">Workspace</legend>
      <p className="hint">Who can open the link stays as you set it above.</p>
      <ShareWorkspaceOption
        checked={selectedId === null}
        detail="Stays in your personal library."
        onSelect={() => onSelect(null)}
        title="Personal library"
        value=""
      />
      {workspaces.map((workspace) => (
        <ShareWorkspaceOption
          checked={selectedId === workspace.id}
          detail="Appears in this workspace library."
          key={workspace.id}
          onSelect={() => onSelect(workspace.id)}
          title={workspace.name}
          value={workspace.id}
        />
      ))}
    </fieldset>
  );
}
