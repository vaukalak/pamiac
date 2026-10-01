import type { LibraryPage } from "@/components/library/library-sidebar";
import { LibraryWorkspaceLinks } from "@/components/library/library-workspace-links";

interface Properties {
  page: LibraryPage;
}

export function LibraryWorkspaceNav(props: Properties) {
  const { page } = props;

  return (
    <>
      <p className="library-rail-label">Workspace</p>
      <LibraryWorkspaceLinks page={page} />
    </>
  );
}
