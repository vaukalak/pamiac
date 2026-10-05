import { LibraryAgentsLinks } from "@/components/library/library-agents-links";
import type { LibraryPage } from "@/components/library/library-sidebar";

interface Properties {
  page: LibraryPage;
  workspaceId: string;
}

export function LibraryAgentsNav(props: Properties) {
  const { page, workspaceId } = props;

  return (
    <div className="library-rail-section">
      <p className="library-rail-label">Agents</p>
      <LibraryAgentsLinks page={page} workspaceId={workspaceId} />
    </div>
  );
}
