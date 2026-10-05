import type { LibraryPage } from "@/components/library/library-sidebar";
import { LibraryWorkspaceLinks } from "@/components/library/library-workspace-links";

interface Properties {
  page: LibraryPage;
}

export function LibraryWorkspaceNav(props: Properties) {
  const { page } = props;

  return (
    <div className="library-rail-section">
      <p className="library-rail-label">Manage</p>
      <LibraryWorkspaceLinks page={page} />
    </div>
  );
}
