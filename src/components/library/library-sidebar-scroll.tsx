import type { LibraryFilter } from "@/components/library/board-document";
import { LibraryAgentsNav } from "@/components/library/library-agents-nav";
import { LibrarySidebarLibrary } from "@/components/library/library-sidebar-library";
import type { LibraryPage } from "@/components/library/library-sidebar";
import { LibraryWorkspaceNav } from "@/components/library/library-workspace-nav";

interface Properties {
  filter: LibraryFilter;
  linked: boolean;
  onFilter: (filter: LibraryFilter) => void;
  page: LibraryPage;
  workspaceId: string;
}

export function LibrarySidebarScroll(props: Properties) {
  const { filter, linked, onFilter, page, workspaceId } = props;

  return (
    <div className="library-sidebar-scroll">
      <LibrarySidebarLibrary
        filter={filter}
        linked={linked}
        onFilter={onFilter}
        workspaceId={workspaceId}
      />
      <LibraryAgentsNav page={page} workspaceId={workspaceId} />
      <LibraryWorkspaceNav page={page} />
    </div>
  );
}
