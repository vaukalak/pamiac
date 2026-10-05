import type { LibraryFilter } from "@/components/library/board-document";
import { LibraryCreate } from "@/components/library/library-create";
import { LibraryNav } from "@/components/library/library-nav";

interface Properties {
  filter: LibraryFilter;
  linked: boolean;
  onFilter: (filter: LibraryFilter) => void;
  workspaceId: string;
}

export function LibrarySidebarLibrary(props: Properties) {
  const { filter, linked, onFilter, workspaceId } = props;

  return (
    <div className="library-rail-section">
      <p className="library-rail-label">Library</p>
      <LibraryNav filter={filter} linked={linked} onFilter={onFilter} />
      <LibraryCreate workspaceId={workspaceId} />
    </div>
  );
}
