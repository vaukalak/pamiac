import { LibraryConnectAgentLink } from "@/components/library/library-connect-agent-link";
import { LibraryConnectionsLink } from "@/components/library/library-connections-link";
import type { LibraryPage } from "@/components/library/library-sidebar";

interface Properties {
  page: LibraryPage;
  workspaceId: string;
}

export function LibraryAgentsLinks(props: Properties) {
  const { page, workspaceId } = props;

  return (
    <nav aria-label="Agents" className="library-nav">
      <LibraryConnectAgentLink workspaceId={workspaceId} />
      <LibraryConnectionsLink page={page} />
    </nav>
  );
}
