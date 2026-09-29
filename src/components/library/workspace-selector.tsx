import { FilterChip } from "@/components/library/filter-chip";
import { librarySpaces } from "@/lib/library-spaces";

interface Properties {
  onSelect: (workspaceId: string) => void;
  selectedId: string;
}

export function WorkspaceSelector(props: Properties) {
  const { onSelect, selectedId } = props;
  const spaces = librarySpaces();

  return (
    <div aria-label="Spaces" className="workspace-selector" role="group">
      {spaces.map((space) => (
        <FilterChip
          key={space.id}
          label={space.label}
          onSelect={() => onSelect(space.id)}
          pressed={selectedId === space.id}
        />
      ))}
    </div>
  );
}
