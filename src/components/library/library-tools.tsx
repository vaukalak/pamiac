import type { LibraryFilter, LibraryView } from "@/components/library/board-document";
import { LibraryCreate } from "@/components/library/library-create";
import { LibraryFilters } from "@/components/library/library-filters";
import { ViewToggle } from "@/components/library/view-toggle";

interface Properties {
  filter: LibraryFilter;
  onFilter: (filter: LibraryFilter) => void;
  onView: (view: LibraryView) => void;
  view: LibraryView;
  workspaceId: string;
}

export function LibraryTools(props: Properties) {
  const { filter, onFilter, onView, view, workspaceId } = props;

  return (
    <div className="library-tools">
      <LibraryFilters filter={filter} onChange={onFilter} />
      <div className="library-tool-actions">
        <LibraryCreate workspaceId={workspaceId} />
        <ViewToggle onChange={onView} view={view} />
      </div>
    </div>
  );
}
