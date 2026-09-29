"use client";

import { useQuery } from "@tanstack/react-query";
import { WorkspaceSpace } from "@/components/library/workspace-space";
import { librarySpaces, type NamedWorkspace } from "@/lib/library-spaces";
import { workspacesQueryOptions } from "@/lib/library-workspaces";

interface Properties {
  initialWorkspaces: NamedWorkspace[];
  onSelect: (workspaceId: string) => void;
  selectedId: string;
}

export function WorkspaceSelector(props: Properties) {
  const { initialWorkspaces, onSelect, selectedId } = props;
  const spacesQuery = useQuery({
    ...workspacesQueryOptions(),
    initialData: initialWorkspaces,
  });
  const spaces = librarySpaces(spacesQuery.data);

  return (
    <div aria-label="Spaces" className="workspace-selector" role="group">
      {spaces.map((space) => (
        <WorkspaceSpace
          key={space.id}
          label={space.label}
          onSelect={() => onSelect(space.id)}
          pressed={selectedId === space.id}
        />
      ))}
    </div>
  );
}
