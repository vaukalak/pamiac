import type { LibraryPage } from "@/components/library/library-sidebar";
import { LibraryWorkspaceLink } from "@/components/library/library-workspace-link";

interface Properties {
  page: LibraryPage;
}

export function LibraryWorkspaceLinks(props: Properties) {
  const { page } = props;

  return (
    <nav aria-label="Workspace" className="library-nav">
      <LibraryWorkspaceLink
        current={page === "settings"}
        href="/workspace/settings"
        label="Workspace settings"
      />
      <LibraryWorkspaceLink
        current={page === "members"}
        href="/workspace/members"
        label="Members"
      />
    </nav>
  );
}
